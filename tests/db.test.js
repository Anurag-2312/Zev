import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  loadMessages,
  saveMessage,
} from "@/lib/db";

// Supabase enforced this with row level security. Prisma does not, so the
// filters in lib/db.js are the only thing standing between two users.

const ALICE = "test-alice@zev.invalid";
const BOB = "test-bob@zev.invalid";

let alice;
let bob;
let aliceConv;

async function removeFixtures() {
  await prisma.user.deleteMany({ where: { email: { in: [ALICE, BOB] } } });
}

beforeAll(async () => {
  await removeFixtures();
  alice = await prisma.user.create({ data: { email: ALICE } });
  bob = await prisma.user.create({ data: { email: BOB } });

  aliceConv = await createConversation(alice.id, "Alice private");
  await saveMessage(aliceConv.id, "user", "alice secret");
  await saveMessage(aliceConv.id, "assistant", "alice reply");
});

afterAll(async () => {
  await removeFixtures();
  await prisma.$disconnect();
});

describe("conversation ownership", () => {
  it("lists only the caller's own conversations", async () => {
    await expect(listConversations(alice.id)).resolves.toHaveLength(1);
    await expect(listConversations(bob.id)).resolves.toHaveLength(0);
  });

  it("hides messages from a user who knows the conversation id", async () => {
    await expect(loadMessages(alice.id, aliceConv.id)).resolves.toHaveLength(2);
    await expect(loadMessages(bob.id, aliceConv.id)).resolves.toEqual([]);
  });

  it("does not resolve another user's conversation", async () => {
    await expect(
      getConversation(alice.id, aliceConv.id)
    ).resolves.not.toBeNull();
    await expect(getConversation(bob.id, aliceConv.id)).resolves.toBeNull();
  });

  it("refuses to delete another user's conversation", async () => {
    await expect(deleteConversation(bob.id, aliceConv.id)).resolves.toBe(false);
    await expect(
      getConversation(alice.id, aliceConv.id)
    ).resolves.not.toBeNull();
  });
});

describe("cascade", () => {
  it("removes a conversation's messages along with it", async () => {
    const conv = await createConversation(bob.id, "Disposable");
    await saveMessage(conv.id, "user", "hello");

    await expect(deleteConversation(bob.id, conv.id)).resolves.toBe(true);
    await expect(
      prisma.message.count({ where: { conversationId: conv.id } })
    ).resolves.toBe(0);
  });
});
