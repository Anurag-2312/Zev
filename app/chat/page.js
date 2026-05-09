"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ChatLayout from "@/components/ChatLayout";
import MessageList from "@/components/MessageList";
import ChatInput from "@/components/ChatInput";
import SearchToggle from "@/components/SearchToggle";

function decodeSourcesHeader(headerValue) {
  if (!headerValue) return null;
  try {
    const bytes = Uint8Array.from(atob(headerValue), (c) => c.charCodeAt(0));
    const text = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.results)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAuthed, setIsAuthed] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const justCreatedRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setIsAuthed(!!data.user))
      .catch(() => setIsAuthed(false));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      // network blip — sidebar keeps last-known state
    }
  }, []);

  useEffect(() => {
    if (isAuthed === true) {
      refreshConversations();
    } else if (isAuthed === false) {
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [isAuthed, refreshConversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    if (justCreatedRef.current === activeConversationId) {
      justCreatedRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/messages?conversationId=${activeConversationId}`
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setMessages(
          (data.messages ?? []).map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            sources: m.sources ?? null,
          }))
        );
      } catch {
        // leave existing messages in place on failure
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  function handleNewChat() {
    setActiveConversationId(null);
    setMessages([]);
  }

  function handleSelectConversation(id) {
    if (sending) return;
    setActiveConversationId(id);
  }

  async function handleDeleteConversation(id) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }

    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        refreshConversations();
      }
    } catch {
      refreshConversations();
    }
  }

  async function handleSend(text) {
    if (isAuthed === null) return;

    const userMsg = { id: crypto.randomUUID(), role: "user", content: text };

    if (isAuthed === false) {
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Please log in to chat. You can sign in from the sidebar to continue.",
        },
      ]);
      return;
    }

    const assistantId = crypto.randomUUID();
    const assistantMsg = { id: assistantId, role: "assistant", content: "" };
    const next = [...messages, userMsg];
    setMessages([...next, assistantMsg]);
    setSending(true);

    const wasNewConversation = !activeConversationId;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          conversationId: activeConversationId,
          useSearch: searchEnabled,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const { error } = await res
          .json()
          .catch(() => ({ error: "Request failed" }));
        let friendly;
        if (res.status === 401) {
          friendly = "Please log in to chat.";
        } else if (res.status === 429) {
          friendly =
            error ||
            "You have reached the current usage limit. Please try again later.";
        } else {
          friendly = `Error: ${error}`;
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: friendly } : m
          )
        );
        return;
      }

      const newConvId = res.headers.get("X-Conversation-Id");
      if (newConvId && newConvId !== activeConversationId) {
        justCreatedRef.current = newConvId;
        setActiveConversationId(newConvId);
      }

      const sourcesHeader = res.headers.get("X-Search-Sources");
      const sources = decodeSourcesHeader(sourcesHeader);
      if (sources) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, sources } : m))
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: buffer } : m
          )
        );
      }

      refreshConversations();
      if (wasNewConversation) {
        setTimeout(() => refreshConversations(), 3000);
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        refreshConversations();
        if (wasNewConversation) {
          setTimeout(() => refreshConversations(), 3000);
        }
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Network error. Please try again." }
              : m
          )
        );
      }
    } finally {
      abortControllerRef.current = null;
      setSending(false);
    }
  }

  function handleStop() {
    abortControllerRef.current?.abort();
  }

  return (
    <ChatLayout
      headerRight={
        <SearchToggle enabled={searchEnabled} onToggle={setSearchEnabled} />
      }
      conversations={conversations}
      activeConversationId={activeConversationId}
      onSelectConversation={handleSelectConversation}
      onNewChat={handleNewChat}
      onDeleteConversation={handleDeleteConversation}
    >
      <MessageList messages={messages} />
      <ChatInput onSend={handleSend} onStop={handleStop} disabled={sending} />
    </ChatLayout>
  );
}
