// // GANTI SELURUH ISI FILE DENGAN KODE INI

// import React, { useState, useRef, useCallback, useEffect } from "react";
// import { Principal } from "@dfinity/principal";
// import { Actor, HttpAgent } from "@dfinity/agent";
// import {
//   idlFactory as icrc1IdlFactory,
//   canisterId as LEDGER_CANISTER_ID,
// } from "../../../../declarations/ledger";
// import {
//   idlFactory as votingAppBackendIdlFactory,
//   canisterId as VOTING_APP_CANISTER_ID,
// } from "../../../../declarations/voting-app-backend";

// const REPLICA_HOST = "http://localhost:4943";

// const getPlug = () => (window as any)?.ic?.plug as any;

// const waitForPlug = async (timeoutMs = 5000, intervalMs = 100): Promise<any> => {
//   const start = Date.now();
//   while (Date.now() - start < timeoutMs) {
//     const p = getPlug();
//     if (p) return p;
//     await new Promise((r) => setTimeout(r, intervalMs));
//   }
//   throw new Error("Plug extension belum siap. Pastikan terpasang & Developer Mode ON.");
// };

// const fmt = (amt: bigint, dec: number) => {
//   const base = 10n ** BigInt(dec);
//   const whole = amt / base;
//   const frac = (amt % base).toString().padStart(dec, "0").slice(0, 6);
//   return `${whole}.${frac}`;
// };


// const usePlugWallet = () => {
//   const [principal, setPrincipal] = useState<Principal | null>(null);
//   const [balance, setBalance] = useState("0.000000");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [votingActor, setVotingActor] = useState<any | null>(null);
  
//   // UBAH: Kita gunakan useState untuk agent agar komponen bisa tahu saat agent sudah siap
//   const [agent, setAgent] = useState<HttpAgent | null>(null);

//   const fetchBalance = useCallback(
//     async (owner: Principal) => {
//       const tempAgent = new HttpAgent({ host: REPLICA_HOST });
//       await tempAgent.fetchRootKey();
//       const actor = Actor.createActor(icrc1IdlFactory, { agent: tempAgent, canisterId: LEDGER_CANISTER_ID });
      
//       const [decimals, raw] = await Promise.all([
//         actor.icrc1_decimals(),
//         actor.icrc1_balance_of({ owner, subaccount: [] }),
//       ]);
//       setBalance(fmt(raw as bigint, Number(decimals)));
//     },
//     []
//   );

//   const connect = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const plug = await waitForPlug();
      
//       // PERBAIKAN: Buat agent terpercaya SEKALI saja saat koneksi
//       console.log("Membuat dan menginisialisasi Trusted Agent manual...");
//       const trustedAgent = new HttpAgent({ host: REPLICA_HOST });
//       await trustedAgent.fetchRootKey();
//       console.log("Trusted Agent berhasil fetchRootKey.");
//       setAgent(trustedAgent); // Simpan agent ke state agar bisa diakses komponen

//       const isConnected = await plug.isConnected();
//       if (!isConnected) {
//         await plug.requestConnect({
//           whitelist: [LEDGER_CANISTER_ID, VOTING_APP_CANISTER_ID],
//           host: REPLICA_HOST,
//         });
//       }

//       const p: Principal = await plug.getPrincipal();
//       if (!p) throw new Error("Gagal mengambil principal dari Plug.");

//       setPrincipal(p);
//       await fetchBalance(p);

//       const actor = await plug.createActor({
//         canisterId: VOTING_APP_CANISTER_ID,
//         interfaceFactory: votingAppBackendIdlFactory,
//         agent: trustedAgent, // Gunakan agent yang sama dan terpercaya
//       });
//       setVotingActor(actor);

//     } catch (e: any) {
//       console.error("Proses koneksi gagal:", e);
//       setError(e?.message ?? "Terjadi kesalahan yang tidak diketahui.");
//       setPrincipal(null);
//       setBalance("0.000000");
//     } finally {
//       setIsLoading(false);
//     }
//   }, [fetchBalance]);
  
//   const disconnect = useCallback(async () => {
//     const plug = getPlug();
//     await plug?.disconnect?.();
//     setPrincipal(null);
//     setBalance("0.000000");
//     setError(null);
//     setVotingActor(null);
//     setAgent(null); // Reset agent saat disconnect
//   }, []);

//   // UBAH: Tambahkan `agent` ke return object agar komponen bisa memakainya
//   return { principal, balance, isLoading, error, isConnected: !!principal, connect, disconnect, votingActor, fetchBalance, agent };
// };

// // ======================================================================
// // FUNGSI HELPER BARU: Mengubah angka menjadi memo (array byte) yang benar
// // ======================================================================
// const numberToMemo = (num: number): number[] => {
//   const buffer = new ArrayBuffer(8); // Memo di ledger adalah 64-bit (8 byte)
//   const view = new DataView(buffer);
//   view.setBigUint64(0, BigInt(num), true); // true = little-endian
//   return Array.from(new Uint8Array(buffer));
// };


// const PlugConnect: React.FC = () => {
//   // UBAH: Ambil `agent` yang sudah siap dari hook
//   const { principal, balance, isLoading, error, isConnected, connect, disconnect, fetchBalance, agent } = usePlugWallet();

//   const [isPaymentLoading, setIsPaymentLoading] = useState(false);
//   const [paymentStatus, setPaymentStatus] = useState('');

//   // PERBAIKAN TOTAL: Fungsi handlePayment yang tangguh
//   const handlePayment = async () => {
//     setIsPaymentLoading(true);
//     setPaymentStatus('Mengirim transaksi...');

//     if (!principal || !agent) {
//       setPaymentStatus('❌ Wallet belum terhubung atau agent belum siap.');
//       setIsPaymentLoading(false);
//       return;
//     }

//     try {
//       const plug = (window as any).ic.plug;
//       if (!plug) throw new Error("Ekstensi Plug Wallet tidak ditemukan.");

//       // LANGSUNG GUNAKAN AGENT DARI HOOK. Tidak perlu buat baru.
//       const localLedgerActor = await plug.createActor({
//         canisterId: LEDGER_CANISTER_ID,
//         interfaceFactory: icrc1IdlFactory,
//         agent: agent, // Menggunakan agent yang konsisten dan terpercaya
//       });

//       const paymentAmountE8s = 1_000_000_000n; // Sesuaikan dengan fee di backend Rust Anda
//       const canisterPrincipal = Principal.fromText(VOTING_APP_CANISTER_ID);
//       const memoBytes = numberToMemo(1337); // Format memo dengan benar

//       // TAHAP 1: "TEMBAK" TRANSAKSI
//       const transferResult = await localLedgerActor.icrc1_transfer({
//         to: { owner: canisterPrincipal, subaccount: [] },
//         amount: paymentAmountE8s,
//         memo: [memoBytes], // Format yang benar untuk `opt vec nat8`
//         fee: [], from_subaccount: [], created_at_time: [],
//       });

//       if ("Ok" in transferResult) {
//         const blockHeight = transferResult.Ok;
//         setPaymentStatus(`✅ Pembayaran berhasil! Block Index: ${blockHeight}`);
//         await fetchBalance(principal);
//       } else {
//         throw new Error(`Transfer gagal di canister: ${JSON.stringify(transferResult.Err)}`);
//       }

//     } catch (e: unknown) {
//       // TAHAP 2: "KONFIRMASI" JIKA TERJADI ERROR JARINGAN YANG DIHARAPKAN
//       if (e instanceof Error && (e.message.includes('Invalid certificate') || e.message.includes('Failed to fetch'))) {
//           console.warn(`Menerima error (${e.message}). Memulai konfirmasi manual...`);
//           setPaymentStatus('⏳ Transaksi terkirim, sedang mengonfirmasi di canister...');

//           setTimeout(async () => {
//             try {
//               await fetchBalance(principal);
//               setPaymentStatus('✅ Transaksi terkonfirmasi! Saldo telah diperbarui.');
//             } catch (confirmError: any) {
//               setPaymentStatus(`❌ Gagal mengonfirmasi transaksi: ${confirmError.message}`);
//             } finally {
//                setIsPaymentLoading(false);
//             }
//           }, 3000);
//       } else if (e instanceof Error) {
//         console.error("Pembayaran gagal karena error tak terduga:", e);
//         setPaymentStatus(`❌ Pembayaran gagal: ${e.message}`);
//         setIsPaymentLoading(false);
//       } else {
//         console.error("Terjadi error dengan tipe yang tidak diketahui:", e);
//         setPaymentStatus(`❌ Pembayaran gagal dengan error yang tidak diketahui.`);
//         setIsPaymentLoading(false);
//       }
//     }
//   };

//   return (
//     <div className="plug-connect-container">
//       {!isConnected ? (
//         <button onClick={connect} disabled={isLoading} className="connect-button">
//           {isLoading ? "Connecting..." : "Connect Plug (Local)"}
//         </button>
//       ) : (
//         <div className="wallet-info">
//           <h4>Wallet Connected (Local)</h4>
//           <p><strong>Principal:</strong> {principal?.toText()}</p>
//           <p><strong>Balance:</strong> {isLoading ? "Loading..." : `${balance} ICP`}</p>
//           <button onClick={disconnect} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Disconnect</button>
          
//           <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
//             <p>Klik tombol di bawah untuk membayar biaya pembuatan proposal.</p>
//             <button onClick={handlePayment} disabled={isPaymentLoading}>
//               {isPaymentLoading ? 'Memproses...' : 'Bayar Biaya Proposal'}
//             </button>
//             {paymentStatus && <p style={{ marginTop: '10px', fontSize: '12px' }}><i>{paymentStatus}</i></p>}
//           </div>
//         </div>
//       )}
//       {error && <div style={{ marginTop: 12, color: "#f87171", fontSize: 12 }}>Error: {error}</div>}
//     </div>
//   );
// };

// export default PlugConnect;