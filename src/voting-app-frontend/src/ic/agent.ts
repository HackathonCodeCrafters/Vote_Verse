import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as backendIDL } from "../../../declarations/voting-app-backend"; // sesuaikan nama
import { host, CANISTER_IDS, isProd } from "./config";

let agent: HttpAgent | null = null;

export const getAgent = async (identity?: any) => {
  if (!agent || identity) {
    agent = new HttpAgent({ host, identity });
    if (!isProd) await agent.fetchRootKey();
  }
  return agent;
};

export const getBackendActor = async (identity?: any) => {
  const a = await getAgent(identity);
  return Actor.createActor(backendIDL, {
    agent: a,
    canisterId: CANISTER_IDS.backend!,
  });
};