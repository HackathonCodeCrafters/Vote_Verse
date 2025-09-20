import { useMemo, useState } from "react";
import {
    Card,
    HStack,
    VStack,
    Input,
    Text,
    Alert,
    Button as CButton,
} from "@chakra-ui/react";
import { CheckCircle, XCircle } from "lucide-react";
import { callCommitVote, callRevealVote } from "@/ic/call";

/* ---------- Phase utils (Commit–Reveal) ---------- */
type Phase = "COMMIT" | "REVEAL" | "CLOSED";
const NS_PER_MS = 1_000_000;
const DAY_MS = 86_400_000;

function getPhase(p: {
    created_at_ns?: bigint;
    createdAt?: string | number;
    duration_days: number;
    reveal_days?: number;
    now?: number;
}): Phase {
    const now = p.now ?? Date.now();
    let createdMs: number;
    if (typeof p.created_at_ns === "bigint") {
        createdMs = Number(p.created_at_ns) / NS_PER_MS;
    } else if (typeof p.createdAt === "number") {
        createdMs = p.createdAt;
    } else if (typeof p.createdAt === "string") {
        createdMs = Date.parse(p.createdAt);
    } else {
        createdMs = now;
    }
    const commitEnd = createdMs + p.duration_days * DAY_MS;
    if (p.reveal_days && p.reveal_days > 0) {
        const revealEnd = commitEnd + p.reveal_days * DAY_MS;
        if (now < commitEnd) return "COMMIT";
        if (now < revealEnd) return "REVEAL";
        return "CLOSED";
    }
    return now < commitEnd ? "COMMIT" : "CLOSED";
}

/* ---------- Hash utils ---------- */
async function sha256Hex(input: string) {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}
async function voteCommitment(choice: "YES" | "NO", salt: string) {
    // pastikan format cocok backend
    return sha256Hex(`${choice}:${salt}`);
}

/* ---------- Props ---------- */
type Props = {
    actor: any;
    principal?: string;
    proposal: {
        id: string;
        mode: "PublicInstant" | "CommitReveal";
        created_at_ns?: bigint;
        createdAt?: string | number;
        duration_days: number;
        reveal_days?: number;
    };
};

export default function CommitRevealVoteCard({ actor, principal, proposal }: Props) {
    const phase = useMemo(
        () =>
            getPhase({
                created_at_ns: proposal.created_at_ns,
                createdAt: proposal.createdAt,
                duration_days: proposal.duration_days,
                reveal_days: proposal.reveal_days,
            }),
        [proposal]
    );

    const [choice, setChoice] = useState<"YES" | "NO" | "">("");
    const [salt, setSalt] = useState<string>(() => crypto.randomUUID());
    const [committing, setCommitting] = useState(false);
    const [revealing, setRevealing] = useState(false);

    const onCommit = async () => {
        if (!actor) return alert("Backend not ready");
        if (!choice) return alert("Choose YES or NO first.");
        try {
            setCommitting(true);
            const commitment = await voteCommitment(choice as "YES" | "NO", salt);
            await callCommitVote(actor, proposal.id, commitment, principal);
            localStorage.setItem(`vote:${proposal.id}`, JSON.stringify({ choice, salt, commitment }));
            alert("Commit stored. Keep your salt for the reveal phase.");
        } catch (e: any) {
            alert(e?.message ?? "Commit failed");
        } finally {
            setCommitting(false);
        }
    };

    const onReveal = async () => {
        if (!actor) return alert("Backend not ready");
        try {
            setRevealing(true);
            const cache = JSON.parse(localStorage.getItem(`vote:${proposal.id}`) || "{}");
            const c = (choice || cache.choice) as "YES" | "NO";
            const s = (salt || cache.salt) as string;
            if (!c || !s) return alert("Missing choice/salt. Make sure you saved it.");
            await callRevealVote(actor, proposal.id, c, s, principal);
            alert("Reveal success!");
        } catch (e: any) {
            alert(e?.message ?? "Reveal failed");
        } finally {
            setRevealing(false);
        }
    };

    if (proposal.mode !== "CommitReveal") {
        return <Text fontSize="sm">Mode: PublicInstant — gunakan UI vote instan.</Text>;
    }

    return (
        <Card.Root>
            <Card.Body>
                <VStack align="stretch" gap={4}>
                    <Text>Mode: Commit–Reveal</Text>

                    {phase === "COMMIT" && (
                        <>
                            <HStack>
                                <CButton
                                    variant={choice === "YES" ? "solid" : "outline"}
                                    onClick={() => setChoice("YES")}
                                    gap={2}
                                >
                                    <CheckCircle size={16} />
                                    YES
                                </CButton>

                                <CButton
                                    variant={choice === "NO" ? "solid" : "outline"}
                                    onClick={() => setChoice("NO")}
                                    gap={2}
                                >
                                    <XCircle size={16} />
                                    NO
                                </CButton>
                            </HStack>

                            <div>
                                <Text fontSize="sm" mb={1}>
                                    Secret Salt
                                </Text>
                                <HStack>
                                    <Input
                                        value={salt}
                                        onChange={(e) => setSalt(e.target.value)}
                                        placeholder="Your secret salt (keep it safe)"
                                    />
                                    <CButton variant="outline" onClick={() => setSalt(crypto.randomUUID())}>
                                        Regenerate
                                    </CButton>
                                </HStack>
                                <Text fontSize="xs" mt={2} color="orange.400">
                                    Simpan salt ini. Kamu akan membutuhkannya saat Reveal.
                                </Text>
                            </div>

                            <CButton onClick={onCommit} disabled={committing}>
                                {committing && (
                                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent align-middle" />
                                )}
                                Commit Vote
                            </CButton>
                        </>
                    )}

                    {phase === "REVEAL" && (
                        <>
                            <HStack>
                                <CButton
                                    variant={choice === "YES" ? "solid" : "outline"}
                                    onClick={() => setChoice("YES")}
                                    gap={2}
                                >
                                    <CheckCircle size={16} />
                                    YES
                                </CButton>
                                <CButton
                                    variant={choice === "NO" ? "solid" : "outline"}
                                    onClick={() => setChoice("NO")}
                                    gap={2}
                                >
                                    <XCircle size={16} />
                                    NO
                                </CButton>
                            </HStack>

                            <div>
                                <Text fontSize="sm" mb={1}>
                                    Salt (same as when committing)
                                </Text>
                                <Input
                                    value={salt}
                                    onChange={(e) => setSalt(e.target.value)}
                                    placeholder="Enter the exact same salt"
                                />
                            </div>

                            <CButton onClick={onReveal} disabled={revealing}>
                                {revealing && (
                                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent align-middle" />
                                )}
                                Reveal Vote
                            </CButton>
                        </>
                    )}

                    {phase === "CLOSED" && (
                        <Alert.Root status="warning">
                            <Alert.Indicator />
                            <Alert.Description>Voting sudah ditutup.</Alert.Description>
                        </Alert.Root>
                    )}
                </VStack>
            </Card.Body>
        </Card.Root>
    );
}
