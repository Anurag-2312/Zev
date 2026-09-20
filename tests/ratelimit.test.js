import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  addTokensUsed,
  chatLimit,
  getTokensUsedToday,
} from "@/lib/ratelimit";

// The Redis implementation these replace was battle-tested by Upstash; this
// one is new, so the counting and the cutoff are worth pinning down.

const USER = "test-ratelimit-user";

async function removeFixtures() {
  await prisma.rateLimit.deleteMany({ where: { userId: USER } });
  await prisma.tokenUsage.deleteMany({ where: { userId: USER } });
}

beforeEach(removeFixtures);

afterAll(async () => {
  await removeFixtures();
  await prisma.$disconnect();
});

describe("chatLimit", () => {
  it("allows the first ten calls in a window and blocks the eleventh", async () => {
    for (let i = 0; i < 10; i += 1) {
      const result = await chatLimit(USER);
      expect(result.success).toBe(true);
    }
    await expect(chatLimit(USER)).resolves.toMatchObject({ success: false });
  });

  it("fails open when there is no user id", async () => {
    await expect(chatLimit("")).resolves.toMatchObject({
      success: true,
      fallback: true,
    });
  });
});

describe("token accounting", () => {
  it("starts at zero and accumulates", async () => {
    await expect(getTokensUsedToday(USER)).resolves.toBe(0);
    await addTokensUsed(USER, 100);
    await addTokensUsed(USER, 250);
    await expect(getTokensUsedToday(USER)).resolves.toBe(350);
  });

  it("ignores non-positive and non-finite amounts", async () => {
    await addTokensUsed(USER, 0);
    await addTokensUsed(USER, -5);
    await addTokensUsed(USER, Number.NaN);
    await expect(getTokensUsedToday(USER)).resolves.toBe(0);
  });
});
