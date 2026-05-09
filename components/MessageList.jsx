"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MessageList({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        <div className="text-center">
          <h2 className="text-xl font-medium">How can I help you today?</h2>
          <p className="mt-2 text-sm">Type a message below to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable_both-edges]">
      <div className="mx-auto max-w-3xl w-full px-4 pt-6 pb-10 flex flex-col gap-4">
        {messages.map((m) => (
          <Bubble
            key={m.id}
            role={m.role}
            content={m.content}
            sources={m.sources}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function Bubble({ role, content, sources }) {
  const isUser = role === "user";
  const sourceResults = sources?.results;
  const hasSources = Array.isArray(sourceResults) && sourceResults.length > 0;
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "whitespace-pre-wrap bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
        }`}
      >
        {isUser ? (
          content
        ) : (
          <>
            <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-pre:bg-zinc-950 prose-pre:text-zinc-100 dark:prose-pre:bg-black">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
            {hasSources && (
              <div className="mt-3 pt-3 border-t border-zinc-300 dark:border-zinc-700">
                <div className="text-xs font-medium mb-1.5">Sources</div>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  {sourceResults.map((r, i) => (
                    <li key={i} className="break-words">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        {r.title || r.url}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
