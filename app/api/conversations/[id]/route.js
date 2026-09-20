import { auth } from "@/auth";
import { deleteConversation } from "@/lib/db";

export async function DELETE(request, { params }) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ error: "id required" }, { status: 400 });
  }

  try {
    const deleted = await deleteConversation(session.user.id, id);
    if (!deleted) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[/api/conversations/:id] delete error:", err);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
