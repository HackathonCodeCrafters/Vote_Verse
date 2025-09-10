import React, { useState, useRef, useCallback } from "react";
import { Principal } from "@dfinity/principal";
import { Actor } from "@dfinity/agent";
import {
  idlFactory as icrc1IdlFactory,
  canisterId as LEDGER_CANISTER_ID, // ← ambil dari declarations (jangan hardcode)
} from "../../../../declarations/ledger";

// =================================================================
// Bagian 1: Konfigurasi & Utilitas
// =================================================================

const REPLICA_HOST = "http://localhost:4943"; // host replica lokal (tetap ke 4943)

const getPlug = () => (window as any)?.ic?.plug as any;

const waitForPlug = async (timeoutMs = 4000, intervalMs = 100): Promise<any> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const p = getPlug();
    if (p) return p;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Plug extension belum siap. Pastikan terpasang & aktifkan Developer Mode.");
};

const truncate = (s: string | undefined, n = 5) => (!s ? "" : `${s.slice(0, n)}...${s.slice(-n)}`);
const fmt = (amt: bigint, dec: number) => {
  const base = 10n ** BigInt(dec);
  const whole = amt / base;
  const frac = (amt % base).toString().padStart(dec, "0").slice(0, 6);
  return `${whole}.${frac}`;
};

// =================================================================
// Bagian 2: Logic Hook (usePlugWallet)
// =================================================================

const usePlugWallet = () => {
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [balance, setBalance] = useState("0.000000");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actorRef = useRef<any>(null);

  const whitelist = [LEDGER_CANISTER_ID];

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const plug = await waitForPlug();

      // Putus sesi lama agar tidak “nempel” network lain
      try { await plug.disconnect?.(); } catch {}

      // 1) Pastikan Plug tersambung ke replica lokal + whitelist canister ledger
      await plug.requestConnect?.({ host: REPLICA_HOST, whitelist });

      // 2) Buat agent (idempotent). Jangan panggil fetchRootKey (tak selalu ada)
      if (typeof plug.createAgent === "function") {
        await plug.createAgent({ host: REPLICA_HOST, whitelist });
      }
      if (!plug.agent) throw new Error("Plug agent tidak tersedia setelah connect.");

      // 3) Buat aktor via @dfinity/agent, memakai agent milik Plug
      actorRef.current = Actor.createActor(icrc1IdlFactory, {
        agent: plug.agent,
        canisterId: LEDGER_CANISTER_ID,
      });

      // 4) Ambil principal dari Plug (tipe Principal)
      const p: Principal =
        (await plug.agent.getPrincipal?.()) ??
        (await plug.getPrincipal?.());
      if (!p) throw new Error("Gagal mengambil principal dari Plug.");
      setPrincipal(p);

      // 5) Ambil saldo
      const [decimals, raw] = await Promise.all([
        actorRef.current.icrc1_decimals(),
        actorRef.current.icrc1_balance_of({ owner: p, subaccount: [] }),
      ]);
      setBalance(fmt(raw as bigint, Number(decimals)));

    } catch (e: any) {
      console.error("Proses koneksi gagal:", e);
      if (/CanisterIdNotFound|canister_not_found/i.test(String(e?.message))) {
        setError(
          "Koneksi gagal: Canister tidak ditemukan di jaringan lokal. " +
          "Pastikan DFX berjalan, canister sudah di-deploy, Network Plug = Local (http://localhost:4943), dan whitelist berisi canister ini."
        );
      } else {
        setError(e?.message ?? "Terjadi kesalahan yang tidak diketahui.");
      }
      setPrincipal(null);
      setBalance("0.000000");
      actorRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const plug = getPlug();
    await plug?.disconnect?.();
    actorRef.current = null;
    setPrincipal(null);
    setBalance("0.000000");
    setError(null);
  }, []);
  
  return {
    principal,
    balance,
    isLoading,
    error,
    isConnected: !!principal,
    connect,
    disconnect,
  };
};

// =================================================================
// Bagian 3: Komponen UI (PlugConnect)
// =================================================================

const PlugConnect: React.FC = () => {
  const { 
    principal, 
    balance, 
    isLoading, 
    error, 
    isConnected, 
    connect, 
    disconnect 
  } = usePlugWallet();

  const handleRefresh = () => {
    if (!isLoading) void connect();
  };

  return (
    <div className="plug-connect-container">
      {!isConnected ? (
        <button onClick={connect} disabled={isLoading} className="connect-button">
          {isLoading ? "Connecting..." : "Connect Plug (Local)"}
        </button>
      ) : (
        <div className="wallet-info">
          <h4>Wallet Connected (Local)</h4>
          <p><strong>Principal:</strong> {truncate(principal?.toText())}</p>
          <p>
            <strong>Balance:</strong> {isLoading ? "Loading..." : `${balance} ICP`}
            <button onClick={handleRefresh} disabled={isLoading} style={{ marginLeft: 8 }}>🔄</button>
          </p>
          <button onClick={disconnect} className="disconnect-button">Disconnect</button>
        </div>
      )}
      {error && <div style={{ marginTop: 12, color: "#f87171", fontSize: 12 }}>Error: {error}</div>}
    </div>
  );
};

export default PlugConnect;
