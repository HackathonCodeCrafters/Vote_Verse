import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory, canisterId as backendCanisterId } from "../../../declarations/voting-app-backend";
import type { _SERVICE as BackendService } from "../../../declarations/voting-app-backend/voting-app-backend.did";

export function opt<T>(v: T | null | undefined): [] | [T] {
  return v == null ? [] : [v];
}

export async function createBackendActor() {
  const agent = new HttpAgent();
  
  if (process.env.DFX_NETWORK !== "ic" && (process as any).env?.DFX_NETWORK !== "ic") {
    await agent.fetchRootKey();
  }

  return Actor.createActor<BackendService>(idlFactory, {
    agent,
    canisterId: backendCanisterId,
  });
}

