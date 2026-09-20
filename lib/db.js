import { prisma } from "@/lib/prisma";

// Supabase enforced per-user access with row level security, so these queries
// used to carry no ownership filter. Prisma has no equivalent — every read and
// every destructive write below scopes to userId explicitly.

export async function listConversations(userId, limit = 50) {
  return prisma.conversation.findMany({
    where: { userId },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function loadMessages(userId, conversationId) {
  // Scoped through the relation: a guessed conversation id belonging to
  // someone else returns an empty list rather than their messages.
  return prisma.message.findMany({
    where: { conversationId, conversation: { userId } },
    select: {
      id: true,
      role: true,
      content: true,
      sources: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getConversation(userId, conversationId) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true, userId: true, title: true },
  });
}

export async function createConversation(userId, title = "New chat") {
  return prisma.conversation.create({
    data: { userId, title },
    select: { id: true },
  });
}

export async function saveMessage(conversationId, role, content, sources = null) {
  await prisma.message.create({
    data: { conversationId, role, content, sources: sources ?? undefined },
  });
}

export async function touchConversation(conversationId) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

export async function updateTitle(conversationId, title) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { title },
  });
}

// deleteMany rather than a check followed by a delete: folding ownership into
// the where clause leaves no window between verifying and acting.
export async function deleteConversation(userId, conversationId) {
  const { count } = await prisma.conversation.deleteMany({
    where: { id: conversationId, userId },
  });
  return count > 0;
}

// Used only to clean up an empty conversation the chat route just created, so
// ownership is already established by the caller.
export async function deleteConversationById(conversationId) {
  await prisma.conversation.delete({ where: { id: conversationId } });
}
