export function saveReminder(id: string, kind: "REVEAL_START") {
  localStorage.setItem(`reminder:${kind}:${id}`, JSON.stringify({ setAt: Date.now() }));
}
export function hasReminder(id: string, kind: "REVEAL_START") {
  return !!localStorage.getItem(`reminder:${kind}:${id}`);
}