import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LogIn, LogOut, RefreshCcw, Wallet as WalletIcon } from "lucide-react";
import { Principal } from "@dfinity/principal";
import {
    idlFactory as icrc1IdlFactory,
    canisterId as LEDGER_CANISTER_ID,
} from "../../../../declarations/ledger";
import { canisterId as VOTING_APP_CANISTER_ID } from "../../../../declarations/voting-app-backend";

type Props = {
    darkMode: boolean;
    isAuthenticated: boolean;
    onPayProposal?: () => Promise<void>;
};

type PlugLike = {
    requestConnect?: (opts?: any) => Promise<boolean>;
    isConnected?: () => Promise<boolean>;
    disconnect?: () => Promise<void>;
    getPrincipal?: () => Promise<any>;
    requestBalance?: () => Promise<any>;
    createActor?: (args: { canisterId: string; interfaceFactory: any }) => Promise<any>;
};

const getPlug = (): PlugLike | undefined =>
    (typeof window !== "undefined" ? (window as any)?.ic?.plug : undefined);

async function getPrincipalTextSafe(plug: PlugLike): Promise<string> {
    if (typeof plug.getPrincipal !== "function") {
        throw new Error("Plug.getPrincipal() tidak tersedia pada environment ini.");
    }
    const p = await plug.getPrincipal();
    return Principal.from(p).toText();
}



function useOutsideClose<T extends HTMLElement>(open: boolean, onClose: () => void) {
    const ref = useRef<T>(null);
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open, onClose]);
    return ref;
}

function formatPrincipalShort(p?: string) {
    if (!p) return "";
    return p.length <= 10 ? p : `${p.slice(0, 6)}…${p.slice(-4)}`;
}

function formatIcrc(balance?: bigint, decimals = 8) {
    if (balance === undefined) return "-";
    const s = balance.toString().padStart(decimals + 1, "0");
    const head = s.slice(0, -decimals);
    const tail = s.slice(-decimals);
    return `${head}.${tail}`.replace(/^0+(\d)/, "$1");
}

export const PlugWalletButton: React.FC<Props> = ({ darkMode, isAuthenticated, onPayProposal }) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [principal, setPrincipal] = useState<string | undefined>();
    const [balance, setBalance] = useState<bigint | undefined>();
    const [symbol, setSymbol] = useState<string | undefined>();
    const [error, setError] = useState<string | null>(null);

    const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));
    const plug = typeof window !== "undefined" ? window.ic?.plug : undefined;

    const chipText = useMemo(() => {
        if (isLoading) return "Loading…";
        return connected ? "Connected" : "Disconnected";
    }, [isLoading, connected]);

    const btnClass = useMemo(
        () =>
            `flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${darkMode
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
            }`,
        [darkMode]
    );

    const menuClass = useMemo(
        () =>
            `absolute right-0 mt-2 w-72 rounded-lg shadow-lg border z-50 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            }`,
        [darkMode]
    );

    const itemClass = (danger = false) =>
        `w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${danger
            ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            : darkMode
                ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                : "text-gray-700 hover:bg-gray-100"
        }`;

    const connect = async () => {
        try {
            setLoading(true);
            setError(null);
            const plug = getPlug();
            if (!plug) throw new Error("Plug Wallet tidak terdeteksi. Install ekstensi Plug.");

            if (typeof plug.requestConnect !== "function") {
                throw new Error("Plug.requestConnect() tidak tersedia.");
            }
            await plug.requestConnect();

            const principalText = await getPrincipalTextSafe(plug);
            setPrincipal(principalText);
            setConnected(true);
            await refreshBalance(); // aman dipanggil (lihat patch di bawah)
        } catch (e: any) {
            setError(e?.message ?? String(e));
        } finally {
            setLoading(false);
        }
    };


    const disconnect = async () => {
        try {
            const plug = getPlug();
            if (plug && typeof plug.disconnect === "function") {
                await plug.disconnect();
            }
        } finally {
            setConnected(false);
            setPrincipal(undefined);
            setBalance(undefined);
            setSymbol(undefined);
        }
    };

    // *** BAYAR BIAYA PROPOSAL ***
    const PROPOSAL_FEE_E8S =
        BigInt(Number(process.env.NEXT_PUBLIC_PROPOSAL_FEE_E8S ?? 100_000)); // default: 0.001 ICP (100_000 e8s). Sesuaikan

    const handlePayment = async () => {
        // Transfer ICRC-1 ke canister backend (owner = principal canister backend)
        // sesuai pola README: panggil ledger.icrc1_transfer ke principal backend. :contentReference[oaicite:1]{index=1}
        const plug = getPlug();
        if (!plug) throw new Error("Plug Wallet tidak terdeteksi.");

        // pastikan sudah connect
        const connectedNow =
            typeof plug.isConnected === "function" ? await plug.isConnected() : false;
        if (!connectedNow) {
            if (typeof plug.requestConnect === "function") {
                await plug.requestConnect();
            } else {
                throw new Error("Tidak bisa connect ke Plug (API requestConnect tidak tersedia).");
            }
        }

        if (typeof plug.createActor !== "function") {
            throw new Error("Plug.createActor() tidak tersedia.");
        }

        // ledger actor
        const ledger = await plug.createActor({
            canisterId: LEDGER_CANISTER_ID,
            interfaceFactory: icrc1IdlFactory,
        });

        const to = {
            owner: Principal.fromText(VOTING_APP_CANISTER_ID), // kirim ke canister backend
            subaccount: [] as [] | [Uint8Array],               // null di Candid = []
        };

        // Struktur arg ICRC-1 (opsional yg tidak diisi = [])
        const args = {
            to,
            amount: PROPOSAL_FEE_E8S,
            fee: [] as [] | [bigint],
            memo: [] as [] | [Uint8Array],
            from_subaccount: [] as [] | [Uint8Array],
            created_at_time: [] as [] | [{ timestamp_nanos: bigint }],
        };

        // @ts-ignore: method name dari IDL ledger ICRC-1
        const res = await ledger.icrc1_transfer(args);

        // opsional: kamu bisa cek variant Ok/Err sesuai IDL ledger kamu
        return res;
    };

    const refreshBalance = async () => {
        try {
            const plug = getPlug();
            if (!plug) return;

            const connectedNow =
                typeof plug.isConnected === "function" ? await plug.isConnected() : false;
            if (!connectedNow) return;

            if (typeof plug.requestBalance === "function") {
                const res = await plug.requestBalance();
                const first = Array.isArray(res) ? res[0] : null;
                if (first?.amount != null) {
                    setBalance(BigInt(Math.round(first.amount * 1e8))); // e8s
                    setSymbol(first.name ?? "ICP");
                }
            }
            // (Kalau perlu akurasi ICRC-1, nanti ganti ke actor ledger)
        } catch (e: any) {
            setError(e?.message ?? String(e));
        }
    };


    // init
    useEffect(() => {
        (async () => {
            try {
                const plug = getPlug();
                const connectedNow =
                    plug && typeof plug.isConnected === "function" ? await plug.isConnected() : false;

                if (connectedNow && plug) {
                    const principalText = await getPrincipalTextSafe(plug);
                    setPrincipal(principalText);
                    setConnected(true);
                    await refreshBalance();
                }
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen((v) => !v)} className={btnClass} aria-haspopup="menu" aria-expanded={open}>
                <WalletIcon size={18} />
                <span className="hidden sm:inline text-sm">{chipText}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className={menuClass}>
                    {!connected ? (
                        <button onClick={async () => { await connect(); setOpen(false); }} className={itemClass()}>
                            <LogIn size={16} />
                            <span>Connect Plug</span>
                        </button>
                    ) : (
                        <>
                            {/* Header info */}
                            <div className={`px-4 py-3 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                                <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Principal</div>
                                <div className="font-mono text-xs break-all">
                                    {formatPrincipalShort(principal)}
                                </div>
                            </div>

                            {/* Balance row */}
                            <div className={`flex items-center justify-between px-4 py-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                <div>
                                    <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Balance</div>
                                    <div className="font-semibold">
                                        {formatIcrc(balance)} {symbol ?? ""}
                                    </div>
                                </div>
                                <button onClick={refreshBalance}
                                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${darkMode
                                            ? "border-gray-700 hover:bg-gray-800 text-gray-300"
                                            : "border-gray-200 hover:bg-gray-100 text-gray-700"
                                        }`}>
                                    <RefreshCcw size={14} /> Refresh
                                </button>
                            </div>

                            {/* Pay proposal */}
                            {onPayProposal && (
                                <button
                                    onClick={async () => {
                                        try {
                                            await handlePayment();
                                            // TODO: tampilkan toast sukses
                                            setOpen(false);
                                        } catch (e: any) {
                                            setError(e?.message ?? String(e));
                                        }
                                    }}
                                    className={itemClass()}
                                >
                                    <WalletIcon size={16} />
                                    <span>Bayar biaya proposal</span>
                                </button>
                            )}

                            {/* Disconnect */}
                            <button onClick={async () => { await disconnect(); setOpen(false); }} className={itemClass(true)}>
                                <LogOut size={16} />
                                <span>Disconnect</span>
                            </button>
                        </>
                    )}

                    {error && (
                        <div className={`m-2 rounded-md px-3 py-2 text-xs ${darkMode ? "bg-red-900/20 text-red-300" : "bg-red-50 text-red-600"
                            }`}>
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
