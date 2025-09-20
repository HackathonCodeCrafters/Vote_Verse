import { useEffect, useState } from "react";

export function useExecute(actor:any, proposalId:string, allowlist?:string[]) {
  const [canExecute, setCanExecute] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async() => {
      try {
        const p = await actor._identity?.getPrincipal?.().toText?.();
        setCanExecute(!!p && (!allowlist?.length || allowlist.includes(p)));
      } catch { setCanExecute(false); }
    })();
  }, [actor, allowlist]);

  const execute = async () => {
    setLoading(true);
    try { await actor.execute_proposal(proposalId); } finally { setLoading(false); }
  };

  return { canExecute, execute, loading };
}