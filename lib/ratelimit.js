import { prisma } from "@/lib/prisma";

// Replaces Upstash Redis. Same exports and the same fail-open behaviour as the
// Redis implementation: a limiter outage must never block chat.

const CHAT_LIMIT = 10;
const WINDOW_MS = 60_000;

export const DAILY_TOKEN_BUDGET = 15_000;

function currentWindowStart() {
  return new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);
}

function utcDay() {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

export async function chatLimit(userId) {
  if (typeof userId !== "string" || !userId) {
    return { success: true, reset: 0, fallback: true };
  }

  const windowStart = currentWindowStart();

  try {
    // increment is atomic in Postgres, so concurrent requests cannot race past
    // the limit the way a read-then-write would.
    const row = await prisma.rateLimit.upsert({
      where: { userId_windowStart: { userId, windowStart } },
      create: { userId, windowStart, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });

    // Redis expired its own keys; Postgres does not. Drop this user's stale
    // windows in the same call so the table stays bounded without a cron job.
    prisma.rateLimit
      .deleteMany({ where: { userId, windowStart: { lt: windowStart } } })
      .catch(() => {});

    return {
      success: row.count <= CHAT_LIMIT,
      reset: windowStart.getTime() + WINDOW_MS,
      fallback: false,
    };
  } catch (err) {
    console.error("[ratelimit] limiter call failed — failing open:", err);
    return { success: true, reset: 0, fallback: true };
  }
}

export async function getTokensUsedToday(userId) {
  if (typeof userId !== "string" || !userId) return 0;

  try {
    const row = await prisma.tokenUsage.findUnique({
      where: { userId_day: { userId, day: utcDay() } },
      select: { tokens: true },
    });
    return row?.tokens ?? 0;
  } catch (err) {
    console.error("[tokens] get failed — failing open:", err);
    return 0;
  }
}

export async function addTokensUsed(userId, amount) {
  if (typeof userId !== "string" || !userId) return;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return;
  }

  const inc = Math.floor(amount);

  try {
    await prisma.tokenUsage.upsert({
      where: { userId_day: { userId, day: utcDay() } },
      create: { userId, day: utcDay(), tokens: inc },
      update: { tokens: { increment: inc } },
    });
  } catch (err) {
    console.error("[tokens] incr failed:", err);
  }
}
