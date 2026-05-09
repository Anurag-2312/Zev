# Zev

A simple, fast AI chatbot built with Next.js. Sign in to save your chats, or jump in as a guest.

## Features

- Streaming chat responses powered by Groq (Llama 3.3 70B)
- Optional web search with citations via Tavily
- Email/password authentication via Supabase
- Persistent conversation history
- Auto-generated chat titles
- Per-user rate limiting and daily token budget via Upstash Redis

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS v4
- **Auth & Database:** Supabase
- **LLM:** Groq SDK
- **Web Search:** Tavily API
- **Rate Limiting:** Upstash Redis

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Anurag-2312/Zev.git
cd zev
npm install
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com) and add two tables: `conversations` (stores chat sessions per user) and `messages` (stores user/assistant messages per conversation). Enable Row Level Security and scope policies to `auth.uid()` so users only access their own data.

### 3. Get API keys

- **Groq** — [console.groq.com](https://console.groq.com)
- **Tavily** — [tavily.com](https://tavily.com)
- **Upstash Redis** — [upstash.com](https://upstash.com) (create a Redis database)

### 4. Configure environment

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Groq
GROQ_API_KEY=your-groq-key
GROQ_MODEL=llama-3.3-70b-versatile

# Tavily
TAVILY_API_KEY=your-tavily-key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  api/             # Route handlers (chat, conversations, messages)
  auth/callback/   # Supabase OAuth callback
  chat/            # Chat UI
  login/           # Auth pages
  signup/
  forgot-password/
  reset-password/
components/        # React components
lib/
  ai.js            # Groq streaming + title generation
  search.js        # Tavily web search
  ratelimit.js     # Upstash rate limiting + token budget
  db.js            # Supabase queries
  supabase/        # Supabase client/server helpers
```

