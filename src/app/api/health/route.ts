import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Simple health check that pings Supabase to prevent free-tier inactivity pause.
// Called by Vercel Cron (see vercel.json).
export async function GET(request: NextRequest) {
  // Verify the request comes from Vercel Cron (prevents public abuse)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const start = Date.now();
  const { error } = await supabase.from("profiles").select("id").limit(1);
  const latencyMs = Date.now() - start;

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, latencyMs },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    latencyMs,
    ts: new Date().toISOString(),
  });
}
