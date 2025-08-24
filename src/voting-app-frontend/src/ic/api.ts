import { createBackendActor } from "./actor";

const opt = (v?: string | null): [] | [string] =>
  v && v.trim() !== "" ? [v] : [];

export async function createProfileAPI(p: {
  image_url?: string | null;
  fullname: string;
  email: string;
  location?: string | null;
  website?: string | null;
  bio?: string | null;
}): Promise<string> {
  const actor = await createBackendActor();

  const result = await actor.create_profile(
    opt(p.image_url),
    p.fullname,
    p.email,
    opt(p.location),
    opt(p.website),
    opt(p.bio),
  );

  return result;
}