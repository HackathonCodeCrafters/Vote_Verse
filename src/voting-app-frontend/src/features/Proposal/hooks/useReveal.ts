import { useState } from "react";
export function useReveal(actor: any, proposalId: string) {
  const [loading, setLoading] = useState(false);
  const reveal = async (choice: "YES"|"NO", salt: string) => {
    setLoading(true);
    try {
      const principal = await actor._identity?.getPrincipal?.().toText?.();
      await actor.reveal_vote(proposalId, principal, choice, salt);
    } finally { setLoading(false); }
  };
  return { reveal, loading };
}