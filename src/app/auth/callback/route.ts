import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/auth/welcome", origin));
    }
  }

  // Exchange failed or no code — redirect to login with error hint
  return NextResponse.redirect(
    new URL("/auth/login?error=email_confirm_failed", origin),
  );
}
