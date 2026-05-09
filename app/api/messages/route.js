import { createClient } from "@/lib/supabase/server";
import { loadMessages } from "@/lib/db";

export async function GET(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) {
    return Response.json(
      { error: "conversationId required" },
      { status: 400 }
    );
  }

  try {
    const messages = await loadMessages(conversationId);
    return Response.json({ messages });
  } catch (err) {
    console.error("[/api/messages] error:", err);
    return Response.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}
