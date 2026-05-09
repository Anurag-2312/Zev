import { createClient } from "@/lib/supabase/server";
import { listConversations } from "@/lib/db";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await listConversations();
    return Response.json({ conversations });
  } catch (err) {
    console.error("[/api/conversations] error:", err);
    return Response.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    );
  }
}
