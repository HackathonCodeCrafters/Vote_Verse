export type Phase = "COMMIT" | "REVEAL" | "CLOSED";
const NS_PER_MS = 1_000_000;
const DAY_MS = 86_400_000;

export function getPhase(p: { created_at_ns: bigint; duration_days: number; reveal_days?: number; now?: number }): Phase {
  const now = p.now ?? Date.now();
  const createdMs = Number(p.created_at_ns) / NS_PER_MS;
  const commitEnd = createdMs + p.duration_days * DAY_MS;
  if (p.reveal_days && p.reveal_days > 0) {
    const revealEnd = commitEnd + p.reveal_days * DAY_MS;
    if (now < commitEnd) return "COMMIT";
    if (now < revealEnd) return "REVEAL";
    return "CLOSED";
  }
  return now < commitEnd ? "COMMIT" : "CLOSED";
}