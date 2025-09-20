import { useState } from "react";
import { voteCommitment } from "@/utils/crypto/hash";

export function useCommit(actor: any, proposalId: string) {
  const [loading, setLoading] = useState(false);
  const commit = async (choice: "YES"|"NO", salt: string) => {
    setLoading(true);
    try {
      const principal = await actor._identity?.getPrincipal?.().toText?.();
      const commitment = await voteCommitment(choice, salt);
      await actor.commit_vote(proposalId, principal, commitment);
      return { commitment };
    } finally { setLoading(false); }
  };
  return { commit, loading };
}