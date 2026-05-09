import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const CHAT_LIMIT = 10;
const CHAT_WINDOW = "60 s";

export const DAILY_TOKEN_BUDGET = 15_000;
const TOKEN_KEY_TTL_SECONDS = 25 * 60 * 60;

let redisClient = null;
function getRedis() {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient = new Redis({ url, token });
  return redisClient;
}

let chatRatelimit = null;
function getChatRatelimit() {
  if (chatRatelimit) return chatRatelimit;
  const redis = getRedis();
  if (!redis) return null;
  chatRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(CHAT_LIMIT, CHAT_WINDOW),
    prefix: "ratelimit:chat",
    analytics: false,
  });
  return chatRatelimit;
}

export async function chatLimit(userId) {
  if (typeof userId !== "string" || !userId) {
    return { success: true, reset: 0, fallback: true };
  }

  const limiter = getChatRatelimit();
  if (!limiter) {
    console.error("[ratelimit] Upstash env missing — failing open");
    return { success: true, reset: 0, fallback: true };
  }

  try {
    const { success, reset } = await limiter.limit(userId);
    return { success, reset, fallback: false };
  } catch (err) {
    console.error("[ratelimit] limiter call failed — failing open:", err);
    return { success: true, reset: 0, fallback: true };
  }
}

function todayKey(userId) {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `tokens:daily:${userId}:${y}${m}${day}`;
}

export async function getTokensUsedToday(userId) {
  if (typeof userId !== "string" || !userId) return 0;
  const redis = getRedis();
  if (!redis) return 0;
  try {
    const value = await redis.get(todayKey(userId));
    if (value == null) return 0;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  } catch (err) {
    console.error("[tokens] get failed — failing open:", err);
    return 0;
  }
}

export async function addTokensUsed(userId, amount) {
  if (typeof userId !== "string" || !userId) return;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return;
  const redis = getRedis();
  if (!redis) return;
  try {
    const key = todayKey(userId);
    const inc = Math.floor(amount);
    const newValue = await redis.incrby(key, inc);
    if (newValue === inc) {
      await redis.expire(key, TOKEN_KEY_TTL_SECONDS);
    }
  } catch (err) {
    console.error("[tokens] incr failed:", err);
  }
}
