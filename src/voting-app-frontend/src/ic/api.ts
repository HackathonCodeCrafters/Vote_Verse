import { createBackendActor } from "./actor";
import type {
  User as CanisterUser,
} from "../../../declarations/voting-app-backend/voting-app-backend.did";

const opt = (v?: string | null): [] | [string] =>
  v && v.trim() !== "" ? [v] : [];

const unopt = (o?: [] | [string]) =>
  Array.isArray(o) && o.length ? o[0] : "";

const unwrapOptNat64ToDateText = (o?: [] | [bigint]) => {
  if (!Array.isArray(o) || o.length === 0) return "";
  const n = o[0]; // bigint
  const ms =
    n >= 1_000_000_000_000_000n 
      ? Number(n / 1_000_000n)
      : Number(n); 
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "";
  }
};

// -------------------- Local persistence --------------------

export function persistProfileId(id: string) {
  try {
    localStorage.setItem("vv_profile_id", id);
  } catch {}
}

export function loadPersistedProfileId(): string | null {
  try {
    return localStorage.getItem("vv_profile_id");
  } catch {
    return null;
  }
}

// snapshot cache (so UI doesn’t flash dummy on refresh)
export function persistProfileCache(data: {
  id: string;
  fullname: string;
  email: string;
  image_url: string;
  location: string;
  website: string;
  bio: string
}) {
  try { localStorage.setItem("vv_profile_cache", JSON.stringify(data)); } catch {}
}
export function loadPersistedProfileCache():
  | { id: string; fullname: string; email: string; image_url: string; location: string; website: string; bio: string }
  | null {
  try {
    const raw = localStorage.getItem("vv_profile_cache");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// -------------------- API calls --------------------

// create_profile: (opt text, text, text, opt text, opt text, opt text) -> (text)
export async function createProfileAPI(params: {
  image_url?: string | null;
  fullname: string;
  email: string;
  location?: string | null;
  website?: string | null;
  bio?: string | null;
}): Promise<string> {
  const actor = await createBackendActor();
  const id = await actor.create_profile(
    opt(params.image_url),
    params.fullname,
    params.email,
    opt(params.location),
    opt(params.website),
    opt(params.bio),
  );

  return id; // string
}

export async function getUserByIdAPI(id: string): Promise<{
  id: string;
  fullname: string;
  email: string;
  image_url: string;
  location: string;
  website: string;
  bio: string;
} | null> {
  const actor = await createBackendActor();
  const optUser = await actor.get_users_by_id(id); // [] | [CanisterUser]

  if (!Array.isArray(optUser) || optUser.length === 0) return null;
  const u = optUser[0] as CanisterUser;

  return {
    id: u.id,
    fullname: u.fullname,
    email: u.email,
    image_url: unopt(u.image_url),
    location: unopt(u.location),
    website: unopt(u.website),
    bio: unopt(u.bio),
  };
}
