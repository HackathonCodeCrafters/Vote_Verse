// ChatInput.tsx
"use client";

import { Loader2, Paperclip, Send } from "lucide-react";
import React, { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  loading?: boolean;
  darkMode?: boolean;
  maxLength?: number;
};

export default function ChatInput({
  value,
  onChange,
  onSend,
  loading = false,
  darkMode = false,
  maxLength = 2000,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize sampai ~6 baris
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const h = Math.min(el.scrollHeight, 140); // ±6 lines
    el.style.height = h + "px";
  }, [value]);

  const canSend = value.trim().length > 0 && !loading;

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    // Enter => kirim | Shift+Enter => newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  const wrapCls = `
    flex items-end gap-2 rounded-xl border p-2 transition
    focus-within:ring-2 focus-within:ring-indigo-500/60
    ${darkMode ? "bg-[#0B1220] border-white/10" : "bg-white border-gray-200"}
  `;

  const taCls = `
    w-full resize-none bg-transparent outline-none text-sm leading-6
    ${
      darkMode
        ? "text-white placeholder:text-gray-400"
        : "text-gray-900 placeholder:text-gray-500"
    }
  `;

  const btnCls = `
    inline-flex items-center justify-center rounded-lg h-9 px-3 text-sm font-medium
    disabled:opacity-50 disabled:cursor-not-allowed
    text-white bg-gradient-to-r from-indigo-600 to-purple-600
    hover:from-indigo-700 hover:to-purple-700
  `;

  return (
    <div>
      <div className={wrapCls}>
        {/* (opsional) tombol lampirkan */}
        <button
          type="button"
          aria-label="Attach"
          className={`h-9 w-9 grid place-items-center rounded-lg ${
            darkMode ? "hover:bg-white/5" : "hover:bg-gray-100"
          }`}
          title="(coming soon) Attach"
        >
          <Paperclip
            size={16}
            className={darkMode ? "text-gray-300" : "text-gray-600"}
          />
        </button>

        <textarea
          ref={ref}
          rows={1}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tulis pesan… (Enter untuk kirim • Shift+Enter baris baru)"
          className={taCls}
          aria-label="Chat message"
        />

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className={btnCls}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Send className="w-4 h-4" />
              Send
            </span>
          )}
        </button>
      </div>

      {/* hint & counter */}
      <div
        className={`mt-1 flex items-center justify-between text-[11px] ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        <span>
          Tekan <kbd className="px-1 py-0.5 rounded border">Enter</kbd> untuk
          kirim • <kbd className="px-1 py-0.5 rounded border">Shift</kbd>+
          <kbd className="px-1 py-0.5 rounded border">Enter</kbd> baris baru
        </span>
        <span>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
