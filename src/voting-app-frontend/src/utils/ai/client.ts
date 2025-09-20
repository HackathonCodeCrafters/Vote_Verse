export async function aiSuggest(prompt: string) {
  const url = import.meta.env.VITE_FETCH_AI_URL;
  if (url) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_FETCH_AI_KEY ?? ""}` },
      body: JSON.stringify({ input: prompt }),
    });
    if (!r.ok) throw new Error("Fetch.ai error");
    const j = await r.json();
    return j.output ?? j;
  }
  const { getBackendActor } = await import("@/ic/agent");
  const actor = await getBackendActor();
  return actor.chat_ai(prompt);
}