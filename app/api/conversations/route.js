import { auth } from "@/auth";
import { listConversations } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await listConversations(session.user.id);
    return Response.json({ conversations });
  } catch (err) {
    console.error("[/api/conversations] error:", err);
    return Response.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    );
  }
}
