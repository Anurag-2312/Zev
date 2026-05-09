"use client";
import { Globe } from "lucide-react";

export default function SearchToggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      className={`h-8 px-3 inline-flex items-center gap-1.5 rounded-full text-xs font-medium border transition-colors ${
        enabled
          ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
          : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-900"
      }`}
    >
      <Globe className="h-3.5 w-3.5" />
      Web search
    </button>
  );
}
