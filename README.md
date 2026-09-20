# Zev

A simple, fast AI chatbot built with Next.js. Sign in to save your chats, or jump in as a guest.

## Features

- Streaming chat responses powered by Groq (GPT-OSS 120B)
- Optional web search with citations via Tavily
- Google sign-in via Auth.js (NextAuth v5)
- Persistent conversation history, each chat at its own URL
- Auto-generated chat titles
- Per-user rate limiting and daily token budget, stored in Postgres

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS v4
- **Database:** Neon (Postgres) via Prisma
- **Auth:** Auth.js (NextAuth v5) with the Google provider
- **LLM:** Groq SDK
- **Web Search:** Tavily API
- **Tests:** Vitest

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Anurag-2312/Zev.git
cd zev
npm install
```

### 2. Set up Neon

Create a project at [neon.tech](https://neon.tech). From the dashboard, copy both
connection strings: the **pooled** one for `DATABASE_URL` (used at runtime) and
the **direct** one for `DIRECT_URL` (used by migrations, which cannot run through
a pooler).

### 3. Set up Google OAuth

In [Google Cloud Console](https://console.cloud.google.com), create a project,
configure the OAuth consent screen as External, then create an **OAuth client ID**
of type Web application. No billing account is required. Register these redirect
URIs:

- `http://localhost:3000/api/auth/callback/google`
- `https://your-domain/api/auth/callback/google`

### 4. Get API keys

- **Groq** — [console.groq.com](https://console.groq.com)
- **Tavily** — [tavily.com](https://tavily.com)

### 5. Configure environment

Create a `.env` file in the project root:

```env
# Neon
DATABASE_URL=postgresql://...pooler.../zev?sslmode=require
DIRECT_URL=postgresql://.../zev?sslmode=require

# Auth.js
AUTH_SECRET=generate-with-npx-auth-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Groq
GROQ_API_KEY=your-groq-key
GROQ_MODEL=openai/gpt-oss-120b

# Tavily
TAVILY_API_KEY=your-tavily-key
```

### 6. Create the database schema

```bash
npx prisma migrate dev --name init
```

### 7. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Prisma owns the schema. After editing `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name describe-your-change   # create + apply a migration
npx prisma studio                                    # browse the data
npx prisma migrate reset                             # wipe and replay (dev only)
```

Production migrations run automatically: `npm run build` calls
`prisma migrate deploy` before `next build`. Commit `prisma/migrations/`.

## Tests

```bash
npm test
```

These are integration tests and run against whatever `DATABASE_URL` points at,
creating and deleting their own fixture rows. Point it at a development database.
One test also calls the Groq API, so a run consumes a small number of tokens.

They cover the cases that clicking through the UI cannot reach, most importantly
that one user cannot read or delete another user's conversations. Supabase
enforced that with row level security; with Prisma it is enforced by the filters
in `lib/db.js`, so the tests are what keep it honest.

## Project Structure

```
app/
  api/             # Route handlers (chat, conversations, messages)
  api/auth/        # Auth.js route handler
  chat/[[...slug]] # Chat UI, serving both /chat and /chat/<id>
  login/           # Sign-in page
components/        # React components
lib/
  ai.js            # Groq streaming + title generation
  search.js        # Tavily web search
  ratelimit.js     # Postgres rate limiting + token budget
  db.js            # Prisma queries, all scoped by user
  prisma.js        # Prisma client singleton
prisma/
  schema.prisma    # Database schema
tests/             # Vitest integration tests
auth.js            # Auth.js configuration
```
