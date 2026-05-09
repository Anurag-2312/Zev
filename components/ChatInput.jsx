"use client";

import { useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";

export default function ChatInput({ onSend, onStop, disabled }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleChange(e) {
    setValue(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 bg-white dark:bg-zinc-950"
    >
      <div className="mx-auto max-w-3xl w-full px-4 pb-4">
        <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-zinc-600">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className="flex-1 resize-none bg-transparent border-0 px-1 py-1.5 text-sm outline-none"
          />
          {disabled ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!value.trim()}
              aria-label="Send"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-zinc-500">
          Shift + Enter for a new line
        </p>
      </div>
    </form>
  );
}
