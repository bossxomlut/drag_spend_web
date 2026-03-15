import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Callers can pass ?next=/auth/reset-password to override the default redirect
  const next = searchParams.get("next") ?? "/auth/welcome";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Exchange failed or no code — redirect to login with error hint
  return NextResponse.redirect(
    new URL("/auth/login?error=link_expired", origin),
  );
}
