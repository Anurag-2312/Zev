"use client";

import { useEffect, useState } from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import Sidebar from "./Sidebar";

export default function ChatLayout({
  children,
  headerRight,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = (matches) => setSidebarOpen(!matches);
    apply(mq.matches);
    const handler = (e) => apply(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const activeTitle = activeConversationId
    ? conversations.find((c) => c.id === activeConversationId)?.title ||
      "New chat"
    : "New chat";

  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onNewChat={onNewChat}
        onDeleteConversation={onDeleteConversation}
      />

      <div
        className={`flex flex-1 min-w-0 min-h-0 flex-col transition-[margin] duration-200 ${
          sidebarOpen ? "md:ml-64" : "ml-0"
        }`}
      >
        <header className="flex items-center justify-between gap-3 px-4 h-14 border-b border-zinc-100 dark:border-zinc-900">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900"
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </button>
          <h1 className="text-sm font-medium truncate">{activeTitle}</h1>
          <div className="ml-auto">{headerRight}</div>
        </header>

        {children}
      </div>
    </div>
  );
}
