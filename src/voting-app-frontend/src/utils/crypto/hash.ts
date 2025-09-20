export async function sha256Hex(input: string | ArrayBuffer | Uint8Array) {
  // Normalisasi ke Uint8Array
  const view =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : input instanceof Uint8Array
      ? input
      : new Uint8Array(input);

  // PAKSA ke ArrayBuffer biasa (bukan SharedArrayBuffer):
  // buat buffer baru & copy datanya
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);

  // copy.buffer dijamin ArrayBuffer, cocok untuk WebCrypto
  const digest = await (globalThis.crypto ?? window.crypto).subtle.digest(
    "SHA-256",
    copy.buffer // <-- ArrayBuffer murni
  );

  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function voteCommitment(choice: "YES" | "NO", salt: string) {
  // Pastikan format ini sama persis dengan backend
  return sha256Hex(`${choice}:${salt}`);
}
