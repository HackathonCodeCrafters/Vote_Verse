import { AuthClient } from "@dfinity/auth-client";
import { getBackendActor } from "./agent";
import { IDENTITY_PROVIDERS, CANISTER_IDS } from "./config";

export type WalletType = "II" | "NFID" | "PLUG";

export const loginII = async () => {
  const auth = await AuthClient.create();
  await auth.login({ identityProvider: IDENTITY_PROVIDERS.II });
  const identity = auth.getIdentity();
  return { identity, actor: await getBackendActor(identity) };
};

export const loginNFID = async () => {
  const auth = await AuthClient.create();
  await auth.login({ identityProvider: IDENTITY_PROVIDERS.NFID });
  const identity = auth.getIdentity();
  return { identity, actor: await getBackendActor(identity) };
};

export const loginPlug = async () => {
  // @ts-ignore
  const plug = (window as any).ic?.plug;
  if (!plug) throw new Error("Plug wallet tidak ditemukan.");
  await plug.requestConnect({ whitelist: [CANISTER_IDS.backend] });
  await plug.createAgent();
  const actor = await plug.createActor({
    canisterId: CANISTER_IDS.backend,
    interfaceFactory: (await import("../../../declarations/voting-app-backend")).idlFactory,
  });
  // @ts-ignore (Plug tidak expose identity standar)
  return { identity: plug.sessionManager?.sessionData?.identity, actor };
};