"use client";

import Button from "@/shared/components/Button";
import {
  Bot,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { voting_app_backend as backend } from "../../../../../declarations/voting-app-backend";

type Role = "system" | "user" | "assistant";
type Turn = { role: Role; content: string };

interface Props {
  darkMode?: boolean;
}

/** Quick starter prompts */
const SUGGESTIONS = [
  "Give me a summary of the latest proposals",
  "Which proposals have the highest yes rate this week?",
  "Help me draft a proposal to optimize staking rewards",
  "What’s the best time to submit a proposal?",
];

export default function AIAssistantWidget({ darkMode = false }: Props) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "system",
      content:
        "You are a helpful governance assistant for VoteVerse. Keep answers concise and practical.",
    },
    {
      role: "assistant",
      content:
        "Hello! I’m your AI governance assistant. I can help analyze proposals, provide voting recommendations, and answer questions about the platform. How can I assist you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [turns, open, minimized, sending]);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  const colors = useMemo(
    () => ({
      // surfaces
      shell:
        "backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl ring-1 " +
        (darkMode
          ? "ring-white/10 bg-slate-900/70"
          : "ring-black/10 bg-white/80"),
      headGrad:
        "bg-gradient-to-r from-fuchsia-600/90 via-violet-600/90 to-indigo-600/90",
      borderSub: darkMode ? "border-white/10" : "border-black/10",
      // text
      text: darkMode ? "text-white" : "text-slate-900",
      sub: darkMode ? "text-slate-300" : "text-slate-600",
      // bubbles
      botBubble: darkMode
        ? "bg-slate-800 text-slate-100"
        : "bg-slate-100 text-slate-800",
      userBubble:
        "bg-gradient-to-br from-fuchsia-600 to-indigo-600 text-white shadow-sm",
      // input
      input:
        "rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 " +
        (darkMode
          ? "bg-slate-800/70 border-white/10 text-white placeholder:text-slate-400"
          : "bg-white/80 border-black/10 text-slate-900 placeholder:text-slate-500"),
      // chips
      chip:
        "px-3 py-1.5 rounded-full text-xs font-medium hover:opacity-90 transition " +
        (darkMode
          ? "bg-white/10 text-slate-200 ring-1 ring-white/15"
          : "bg-slate-100 text-slate-700 ring-1 ring-black/10"),
      // launcher
      launcher:
        "fixed bottom-6 right-6 z-40 rounded-full px-4 h-12 text-sm font-semibold shadow-xl " +
        "bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:opacity-95",
    }),
    [darkMode]
  );

  // ---- LLM caller (chat_ai -> prompting fallback)
  const callLLM = async (allTurns: Turn[]) => {
    const api: any = backend as any;
    if (typeof api.chat_ai === "function") {
      return (await api.chat_ai(
        allTurns.map((t) => ({ role: t.role, content: t.content }))
      )) as string;
    }
    const merged =
      allTurns.map((t) => `[${t.role}]: ${t.content}`).join("\n") +
      "\n[assistant]:";
    return (await api.prompting(merged)) as string;
  };

  const send = async (prefill?: string) => {
    if (sending) return;
    const text = (prefill ?? input).trim();
    if (!text) return;

    setErr("");
    const next = [...turns, { role: "user" as Role, content: text }];
    setTurns(next);
    setInput("");
    setSending(true);

    try {
      const reply = await callLLM(next);
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: String(reply) },
      ]);
    } catch (e: any) {
      setErr(e?.message || "Failed to contact AI canister.");
    } finally {
      setSending(false);
      // keep focus on the input and scroll to bottom
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        bodyRef.current?.scrollTo({
          top: bodyRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  };

  return (
    <>
      {!open && (
        <button className={colors.launcher} onClick={() => setOpen(true)}>
          <Sparkles size={16} className="inline mr-2" />
          Chat with AI
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[92vw]">
          <div className={colors.shell}>
            {/* Header */}
            <div className={`px-4 py-3 ${colors.headGrad}`}>
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                  <span className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    AI Assistant
                  </p>
                  <p className="text-[11px] text-white/80">
                    Online • Governance helper
                  </p>
                </div>
                <button
                  onClick={() => setMinimized((m) => !m)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white"
                  aria-label={minimized ? "Expand" : "Minimize"}
                >
                  {minimized ? (
                    <Maximize2 size={16} />
                  ) : (
                    <Minimize2 size={16} />
                  )}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            {!minimized && (
              <>
                <div
                  ref={bodyRef}
                  className="px-4 py-3 max-h-[56vh] overflow-y-auto space-y-3"
                >
                  {turns
                    .filter((t) => t.role !== "system")
                    .map((t, i) => (
                      <Bubble
                        key={i}
                        role={t.role}
                        text={t.content}
                        darkMode={darkMode}
                      />
                    ))}

                  {sending && <Typing darkMode={darkMode} />}

                  {/* Quick suggestions muncul saat percakapan masih pendek */}
                  {turns.length <= 2 && !sending && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          className={colors.chip}
                          onClick={() => send(s)}
                          title="Use this prompt"
                        >
                          <Zap size={12} className="inline mr-1" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {err && <p className="text-xs text-red-400">{err}</p>}
                </div>

                {/* Input */}
                {/* Input */}
                <div className={`p-3 border-t ${colors.borderSub}`}>
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKey}
                      placeholder="Ask me…"
                      className={colors.input + " w-full h-10"}
                      aria-label="Chat message"
                      disabled={sending}
                      maxLength={2000}
                    />
                    <Button
                      onClick={() => send()}
                      disabled={sending || !input.trim()}
                      className="h-10 inline-flex items-center gap-2 rounded-xl"
                      variant="gradient"
                    >
                      {sending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      Send
                    </Button>
                  </div>

                  {/* hint */}
                  <p
                    className={`text-[10px] mt-1 text-center ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Press{" "}
                    <kbd className="px-1 rounded border border-white/20">
                      Enter
                    </kbd>{" "}
                    to send
                  </p>
                  <p
                    className={`text-[10px] mt-1 text-center ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Powered by AI · ICP
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** Chat bubble component */
function Bubble({
  role,
  text,
  darkMode,
}: {
  role: Role;
  text: string;
  darkMode: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap px-3 py-2 text-sm rounded-2xl ${
          isUser
            ? "bg-gradient-to-br from-fuchsia-600 to-indigo-600 text-white rounded-br-sm"
            : darkMode
            ? "bg-slate-800 text-slate-100 rounded-bl-sm"
            : "bg-slate-100 text-slate-800 rounded-bl-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

/** Typing indicator */
function Typing({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="flex justify-start">
      <div
        className={`px-3 py-2 rounded-2xl text-sm inline-flex items-center gap-2 ${
          darkMode
            ? "bg-slate-800 text-slate-100"
            : "bg-slate-100 text-slate-800"
        }`}
      >
        <Loader2 className="animate-spin" size={14} />
        Thinking…
      </div>
    </div>
  );
}
