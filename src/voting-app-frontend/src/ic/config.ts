export const isProd = import.meta.env.VITE_IC_NETWORK === "ic";
export const host = isProd ? "https://icp-api.io" : "http://127.0.0.1:4943";

export const CANISTER_IDS = {
  backend: import.meta.env.VITE_BACKEND_CANISTER_ID, // contoh: "abcd1-...-cai"
};

export const IDENTITY_PROVIDERS = {
  II: "https://identity.ic0.app",
  NFID: "https://nfid.one",
};