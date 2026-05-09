import { createClient } from "@/lib/supabase/server";

export async function listConversations(limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function loadMessages(conversationId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, sources, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getConversation(conversationId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, user_id, title")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function createConversation(userId, title = "New chat") {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, title })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function saveMessage(conversationId, role, content, sources = null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content, sources });
  if (error) throw error;
}

export async function touchConversation(conversationId) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (error) throw error;
}

export async function updateTitle(conversationId, title) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", conversationId);
  if (error) throw error;
}

export async function deleteConversation(conversationId) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId);
  if (error) throw error;
}
