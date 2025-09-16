import React, { useState, useRef, useCallback, useEffect } from "react";
import { Principal } from "@dfinity/principal";
import { Actor, HttpAgent } from "@dfinity/agent";
import {
  idlFactory as icrc1IdlFactory,
  canisterId as LEDGER_CANISTER_ID,
} from "../../../../declarations/ledger";

import {
  idlFactory as votingAppBackendIdlFactory,
  canisterId as VOTING_APP_CANISTER_ID,
} from "../../../../declarations/voting-app-backend";


const REPLICA_HOST = "http://localhost:4943";

const getPlug = () => (window as any)?.ic?.plug as any;

const waitForPlug = async (timeoutMs = 5000, intervalMs = 100): Promise<any> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const p = getPlug();
    if (p) return p;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Plug extension belum siap. Pastikan terpasang & Developer Mode ON.");
};

const truncate = (s: string | undefined, n = 5) => (!s ? "" : `${s.slice(0, n)}...${s.slice(-n)}`);
const fmt = (amt: bigint, dec: number) => {
  const base = 10n ** BigInt(dec);
  const whole = amt / base;
  const frac = (amt % base).toString().padStart(dec, "0").slice(0, 6);
  return `${whole}.${frac}`;
};


const usePlugWallet = () => {
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [balance, setBalance] = useState("0.000000");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [votingActor, setVotingActor] = useState<any | null>(null);


  const anonActorRef = useRef<any>(null);
  const rehydratingRef = useRef(false);

  const ensureAnonActor = useCallback(async () => {
    if (anonActorRef.current) return anonActorRef.current;
    const agent = new HttpAgent({ host: REPLICA_HOST });
    try {
      await agent.fetchRootKey(); // WAJIB di lokal
    } catch (e) {
      console.error("[fetchRootKey] gagal:", e);
    }
    anonActorRef.current = Actor.createActor(icrc1IdlFactory, {
      agent,
      canisterId: LEDGER_CANISTER_ID,
    });
    return anonActorRef.current;
  }, []);


  const fetchBalance = useCallback(
    async (owner: Principal) => {
      const actor = await ensureAnonActor();
      const [decimals, raw] = await Promise.all([
        actor.icrc1_decimals(),
        actor.icrc1_balance_of({ owner, subaccount: [] }),
      ]);

      console.log('Nilai saldo mentah dari canister:', raw.toString());

      setBalance(fmt(raw as bigint, Number(decimals)));
    },
    [ensureAnonActor]
  );

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const plug = await waitForPlug();

      const already = (await plug.isConnected?.()) === true;
      if (!already) {
        await plug.requestConnect?.({ host: REPLICA_HOST, whitelist: [LEDGER_CANISTER_ID] });
      }

      if (typeof plug.createAgent === "function") {
        await plug.createAgent({ host: REPLICA_HOST, whitelist: [LEDGER_CANISTER_ID] });
      }

      const p: Principal =
        (await plug?.agent?.getPrincipal?.()) ??
        (await plug?.getPrincipal?.());
      if (!p) throw new Error("Gagal mengambil principal dari Plug.");

      setPrincipal(p);
      await fetchBalance(p);


      const agent = new HttpAgent({ host: REPLICA_HOST });
      await agent.fetchRootKey();

      const actor = await plug.createActor({
        canisterId: VOTING_APP_CANISTER_ID,
        interfaceFactory: votingAppBackendIdlFactory,
        agent: agent, // <-- Ini kuncinya
      });

      setVotingActor(actor);

    } catch (e: any) {
      console.error("Proses koneksi gagal:", e);
      if (/Invalid certificate/i.test(String(e?.message))) {
        setError("Invalid certificate: pastikan memakai 127.0.0.1:4943 & root key sudah di-fetch.");
      } else if (/CanisterIdNotFound|canister_not_found/i.test(String(e?.message))) {
        setError(
          "Canister tidak ditemukan di replica lokal. Jalankan `dfx start --clean` & `dfx deploy`, lalu restart dev server."
        );
      } else {
        setError(e?.message ?? "Terjadi kesalahan yang tidak diketahui.");
      }
      setPrincipal(null);
      setBalance("0.000000");
      anonActorRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBalance]);

  const rehydrate = useCallback(async () => {
    if (rehydratingRef.current) return;
    rehydratingRef.current = true;
    try {
      const plug = await waitForPlug();
      const connected = (await plug.isConnected?.()) === true;
      if (!connected) return;

      if (typeof plug.createAgent === "function") {
        await plug.createAgent({ host: REPLICA_HOST, whitelist: [LEDGER_CANISTER_ID] });
      }

      const p: Principal =
        (await plug?.agent?.getPrincipal?.()) ??
        (await plug?.getPrincipal?.());
      if (!p) return;

      setPrincipal(p);
      await fetchBalance(p);

     // --- GANTI DENGAN BLOK INI ---
      // 1. Buat agent manual yang terpercaya
      const agent = new HttpAgent({ host: REPLICA_HOST });
      await agent.fetchRootKey();

      // 2. Suntikkan agent terpercaya kita ke dalam Plug saat membuat actor
      const actor = await plug.createActor({
        canisterId: VOTING_APP_CANISTER_ID,
        interfaceFactory: votingAppBackendIdlFactory,
        agent: agent, // <-- Ini kuncinya
      });

      setVotingActor(actor);
      // -----------------------------

    } catch (e) {
      console.warn("[rehydrate] gagal:", e);
    } finally {
      rehydratingRef.current = false;
    }
  }, [fetchBalance]);

  useEffect(() => {
    void rehydrate();
    const onVisible = () => {
      if (document.visibilityState === "visible") void rehydrate();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [rehydrate]);

  const disconnect = useCallback(async () => {
    const plug = getPlug();
    await plug?.disconnect?.();
    anonActorRef.current = null;
    setPrincipal(null);
    setBalance("0.000000");
    setError(null);
    setVotingActor(null);

  }, []);

  return { principal, balance, isLoading, error, isConnected: !!principal, connect, disconnect, votingActor};
};

const PlugConnect: React.FC = () => {
  const {
    principal,
    balance,
    isLoading,
    error,
    isConnected,
    connect,
    disconnect,
    votingActor
  } = usePlugWallet();


  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');

const handlePayment = async () => {
  setIsPaymentLoading(true);
  setPaymentStatus('Menunggu konfirmasi pembayaran di Plug Wallet...');

  try {
    const plug = (window as any).ic.plug;
    if (!plug) throw new Error("Ekstensi Plug Wallet tidak ditemukan.");


    const localLedgerActor = await plug.createActor({
      canisterId: LEDGER_CANISTER_ID,
      interfaceFactory: icrc1IdlFactory,
    });

    const paymentAmountE8s = 10_000_000n;

    const canisterPrincipal = Principal.fromText(VOTING_APP_CANISTER_ID);

    const transferResult = await localLedgerActor.icrc1_transfer({
      to: { owner: canisterPrincipal, subaccount: [] },
      amount: paymentAmountE8s,
      fee: [], memo: [], from_subaccount: [], created_at_time: [],
    });

    if ("Ok" in transferResult) {
      const blockHeight = transferResult.Ok;
      setPaymentStatus(`✅ Pembayaran berhasil! Block Height: ${blockHeight}`);
      console.log("Transaksi berhasil, blockHeight:", blockHeight);
    } else {
      const errKey = Object.keys(transferResult.Err)[0];
      throw new Error(`Transfer gagal: ${errKey}`);
    }
  } catch (error: any) {
    console.error("Pembayaran gagal:", error);
    setPaymentStatus(`❌ Pembayaran gagal: ${error.message}`);
  } finally {
    setIsPaymentLoading(false);
  }
};

  // -----------------------------

  return (
    <div className="plug-connect-container">
      {!isConnected ? (
        <button onClick={connect} disabled={isLoading} className="connect-button">
          {isLoading ? "Connecting..." : "Connect Plug (Local)"}
        </button>
      ) : (
        <div className="wallet-info">
          <h4>Wallet Connected (Local)</h4>
          <p>
            <strong>Principal:</strong> {principal?.toText()}
            </p>
            <p>actor </p>
          <p><strong>Balance:</strong> {isLoading ? "Loading..." : `${balance} ICP`}</p>
            <button onClick={disconnect} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Disconnect</button>
            



             <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
            <p>Klik tombol di bawah untuk membayar biaya pembuatan proposal.</p>
            <button 
              onClick={handlePayment} 
              disabled={isPaymentLoading}
            >
              {isPaymentLoading ? 'Memproses...' : 'Bayar 0.1 ICP'}
            </button>
            {/* Tampilkan pesan status dari proses pembayaran */}
            {paymentStatus && <p style={{ marginTop: '10px', fontSize: '12px' }}><i>{paymentStatus}</i></p>}
          </div>
        </div>

          
      )}
      {error && <div style={{ marginTop: 12, color: "#f87171", fontSize: 12 }}>Error: {error}</div>}
    </div>
  );
};

export default PlugConnect;
