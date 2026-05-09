import { streamChat, generateTitle } from "@/lib/ai";
import { webSearch, buildSearchSystemMessage } from "@/lib/search";
import {
  chatLimit,
  getTokensUsedToday,
  addTokensUsed,
  DAILY_TOKEN_BUDGET,
} from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";
import {
  createConversation,
  getConversation,
  saveMessage,
  touchConversation,
  updateTitle,
  deleteConversation,
} from "@/lib/db";

export const maxDuration = 60;

const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 10_000;
const TIMEOUT_MS = 30_000;

export async function POST(request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json(
      { error: "Please log in to chat." },
      { status: 401 }
    );
  }

  const limit = await chatLimit(user.id);
  if (!limit.success) {
    const retryAfter = Math.max(
      1,
      Math.ceil((limit.reset - Date.now()) / 1000)
    );
    return Response.json(
      {
        error:
          "You have reached the current usage limit. Please try again later.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  const tokensUsed = await getTokensUsedToday(user.id);
  if (tokensUsed >= DAILY_TOKEN_BUDGET) {
    return Response.json(
      {
        error:
          "You have reached your daily message limit. Please try again tomorrow.",
      },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, conversationId: requestedConvId, useSearch } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }
  if (messages.length > MAX_MESSAGES) {
    return Response.json({ error: "Too many messages" }, { status: 413 });
  }
  for (const m of messages) {
    if (typeof m?.content !== "string" || m.content.length > MAX_CONTENT_LENGTH) {
      return Response.json({ error: "Message too long" }, { status: 413 });
    }
  }
  const last = messages[messages.length - 1];
  if (!last.content.trim()) {
    return Response.json({ error: "Empty prompt" }, { status: 400 });
  }
  if (last.role !== "user") {
    return Response.json(
      { error: "Last message must be from user" },
      { status: 400 }
    );
  }

  let conversationId = requestedConvId ?? null;
  let isNewConversation = false;

  if (conversationId) {
    const conv = await getConversation(conversationId);
    if (!conv || conv.user_id !== user.id) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
  } else {
    try {
      const conv = await createConversation(user.id);
      conversationId = conv.id;
      isNewConversation = true;
    } catch (err) {
      console.error("[/api/chat] conversation create failed:", err);
      return Response.json(
        { error: "Failed to start conversation" },
        { status: 500 }
      );
    }
  }

  const cleanMessages = messages.map(({ role, content }) => ({ role, content }));
  const lastUserContent = last.content;

  let searchPayload = null;
  if (useSearch === true) {
    try {
      const result = await webSearch(lastUserContent);
      const systemMsg = buildSearchSystemMessage(result);
      if (systemMsg) {
        cleanMessages.unshift(systemMsg);
        searchPayload = result;
      }
    } catch (err) {
      console.error("[/api/chat] web search failed:", err);
    }
  }

  const abort = new AbortController();
  const onClientAbort = () => abort.abort();
  request.signal.addEventListener("abort", onClientAbort);
  const timeout = setTimeout(() => abort.abort(), TIMEOUT_MS);

  let fullAssistantContent = "";
  let chatUsage = null;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat(cleanMessages, abort.signal)) {
          if (chunk.type === "delta") {
            fullAssistantContent += chunk.content;
            controller.enqueue(encoder.encode(chunk.content));
          } else if (chunk.type === "usage") {
            chatUsage = chunk.usage;
          }
        }
        controller.close();
      } catch (err) {
        console.error("[/api/chat] stream error:", err);
        try {
          controller.error(err);
        } catch {}
      } finally {
        clearTimeout(timeout);
        request.signal.removeEventListener("abort", onClientAbort);
      }

      if (chatUsage?.total_tokens) {
        await addTokensUsed(user.id, chatUsage.total_tokens);
      }

      if (fullAssistantContent) {
        try {
          await saveMessage(conversationId, "user", lastUserContent);
          await saveMessage(
            conversationId,
            "assistant",
            fullAssistantContent,
            searchPayload
          );
          await touchConversation(conversationId);
        } catch (err) {
          console.error("[/api/chat] persistence error:", err);
        }

        if (isNewConversation) {
          try {
            const { title, usage: titleUsage } = await generateTitle(
              lastUserContent,
              fullAssistantContent
            );
            await updateTitle(conversationId, title);
            if (titleUsage?.total_tokens) {
              await addTokensUsed(user.id, titleUsage.total_tokens);
            }
          } catch (err) {
            console.error("[/api/chat] title gen failed:", err);
          }
        }
      } else if (isNewConversation) {
        try {
          await deleteConversation(conversationId);
        } catch (err) {
          console.error("[/api/chat] cleanup failed:", err);
        }
      }
    },
  });

  const responseHeaders = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Conversation-Id": conversationId,
  };
  if (searchPayload) {
    responseHeaders["X-Search-Sources"] = Buffer.from(
      JSON.stringify(searchPayload),
      "utf-8"
    ).toString("base64");
  }

  return new Response(stream, { headers: responseHeaders });
}
