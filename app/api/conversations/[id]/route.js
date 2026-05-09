import { createClient } from "@/lib/supabase/server";
import { deleteConversation, getConversation } from "@/lib/db";

export async function DELETE(request, { params }) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ error: "id required" }, { status: 400 });
  }

  const conv = await getConversation(id);
  if (!conv || conv.user_id !== user.id) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  try {
    await deleteConversation(id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[/api/conversations/:id] delete error:", err);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
