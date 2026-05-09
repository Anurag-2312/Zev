import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL;
const TITLE_MODEL = "llama-3.1-8b-instant";
const CHAT_MAX_TOKENS = 1500;

export async function* streamChat(messages, signal) {
  const stream = await groq.chat.completions.create(
    {
      model: MODEL,
      messages,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: CHAT_MAX_TOKENS,
    },
    { signal },
  );

  for await (const chunk of stream) {
    if (signal?.aborted) break;
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) yield { type: "delta", content: delta };
    if (chunk.usage) yield { type: "usage", usage: chunk.usage };
  }
}

export async function generateTitle(userMessage, assistantMessage) {
  const userSnippet = userMessage.slice(0, 500);
  const assistantSnippet = assistantMessage.slice(0, 500);

  const completion = await groq.chat.completions.create({
    model: TITLE_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You generate concise chat titles. Given a user message and the assistant's reply, write a 3-6 word title summarizing the topic. Return only the title. No quotes. No trailing punctuation.",
      },
      {
        role: "user",
        content: `User message: ${userSnippet}\n\nAssistant reply: ${assistantSnippet}`,
      },
    ],
    max_tokens: 20,
    temperature: 0.3,
  });

  const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";
  const cleaned = raw
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.!?]+$/, "")
    .trim()
    .slice(0, 80);

  return {
    title: cleaned || "New chat",
    usage: completion.usage ?? null,
  };
}
