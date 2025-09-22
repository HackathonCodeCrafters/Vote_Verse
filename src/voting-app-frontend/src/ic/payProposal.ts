import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory as votingAppBackendIdlFactory, canisterId as VOTING_APP_CANISTER_ID } from "../../../declarations/voting-app-backend";
// @ts-ignore
declare const window: any;

export async function payProposalFee() {
  // Versi via Plug: gunakan signer dari Plug untuk membuat actor
  const plug = window.ic?.plug;
  if (!plug) throw new Error("Plug tidak tersedia");

  // Jika kamu sudah generate declarations via dfx, kamu bisa: plug.createActor
  // Pastikan canisterId dan idlFactory sesuai
  const backend = await plug.createActor({
    canisterId: VOTING_APP_CANISTER_ID,
    interfaceFactory: votingAppBackendIdlFactory,
  });

  // Contoh: kalau backend expose method `pay_proposal_fee()` (ganti sesuai method kamu)
  // Bisa juga butuh parameter amount nat atau memo.
  // @ts-ignore
  const res = await backend.pay_proposal_fee();
  return res;
}
