import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value) {
  if (typeof value !== "string") return "/chat";
  if (!value.startsWith("/")) return "/chat";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/chat";
  return value;
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNext(searchParams.get("next"));

  if (tokenHash && type) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      // fall through to the error redirect below
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
