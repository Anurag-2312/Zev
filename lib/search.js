const TAVILY_ENDPOINT = "https://api.tavily.com/search";
const SEARCH_TIMEOUT_MS = 8_000;
const MAX_QUERY_LENGTH = 400;
const MAX_RESULTS = 5;
const MAX_SNIPPET_LENGTH = 600;
const MAX_TITLE_LENGTH = 200;

function sanitize(text) {
  if (typeof text !== "string") return "";
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const isControl =
      code < 0x09 ||
      code === 0x0b ||
      code === 0x0c ||
      (code >= 0x0e && code <= 0x1f) ||
      code === 0x7f;
    if (!isControl) out += text[i];
  }
  return out.replace(/\s+/g, " ").trim();
}

function isSafeUrl(u) {
  if (typeof u !== "string") return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function webSearch(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not configured");

  const cleanQuery = String(query ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  if (!cleanQuery) throw new Error("Empty search query");

  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), SEARCH_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: cleanQuery,
        search_depth: "basic",
        max_results: MAX_RESULTS,
        include_answer: false,
      }),
      signal: abort.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Tavily request failed: ${response.status}`);
  }

  const json = await response.json();
  const raw = Array.isArray(json?.results) ? json.results : [];

  const results = raw
    .map((r) => ({
      title: sanitize(r?.title).slice(0, MAX_TITLE_LENGTH),
      url: typeof r?.url === "string" ? r.url : "",
      snippet: sanitize(r?.content).slice(0, MAX_SNIPPET_LENGTH),
    }))
    .filter((r) => isSafeUrl(r.url) && r.snippet)
    .slice(0, MAX_RESULTS);

  return { query: cleanQuery, results };
}

export function buildSearchSystemMessage({ query, results }) {
  if (!results || results.length === 0) return null;
  const sourceLines = results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title || r.url}\nURL: ${r.url}\nExcerpt: ${r.snippet}`
    )
    .join("\n\n");
  return {
    role: "system",
    content:
      `The user enabled web search. The following are search results for: "${query}".\n\n` +
      sourceLines +
      `\n\nUse these results to inform your answer. Cite sources inline using [1], [2], etc. matching the numbers above. If a result is irrelevant, ignore it. Do not invent URLs or facts not supported by the results.`,
  };
}
