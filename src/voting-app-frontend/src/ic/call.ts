type ChoiceNew = { Yes: null } | { No: null };

export async function callVoteProposal(actor: any, id: string, vote: "yes" | "no", principal?: string) {
  const choiceNew: ChoiceNew = vote === "yes" ? { Yes: null } : { No: null };
  try {
    // coba signature BARU: (id, choice)
    return await actor.vote_proposal(id, choiceNew);
  } catch {
    // fallback signature LAMA: (id, principal, choice)
    if (!principal) throw new Error("Principal required for legacy vote_proposal");
    return await actor.vote_proposal(id, principal, choiceNew);
  }
}

export async function callCommitVote(actor: any, id: string, commitment: string, principal?: string) {
  try {
    // (id, commitment)
    return await actor.commit_vote(id, commitment);
  } catch {
    if (!principal) throw new Error("Principal required for legacy commit_vote");
    // (id, principal, commitment)
    return await actor.commit_vote(id, principal, commitment);
  }
}

export async function callRevealVote(actor: any, id: string, choice: "YES"|"NO", salt: string, principal?: string) {
  const variant = choice === "YES" ? { Yes: null } : { No: null };
  try {
    // (id, choice, salt)
    return await actor.reveal_vote(id, variant, salt);
  } catch {
    if (!principal) throw new Error("Principal required for legacy reveal_vote");
    // (id, principal, choice, salt)
    return await actor.reveal_vote(id, principal, variant, salt);
  }
}

export async function callExecute(actor: any, id: string) {
  // eksekusi tetap sama
  return actor.execute_proposal?.(id);
}