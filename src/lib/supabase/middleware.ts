import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Profile cache cookie ──────────────────────────────────────────────────────
// Stores language + deleted_at for 5 min so we skip the DB query per request.
// Format: "<language>|<deleted_at>|<timestamp_ms>"  (empty string for null values)
const PROFILE_CACHE_COOKIE = "__ds_pcache";
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;

function readProfileCache(
  request: NextRequest,
): { language: string | null; deleted_at: string | null } | null {
  const raw = request.cookies.get(PROFILE_CACHE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parts = raw.split("|");
    if (parts.length !== 3) return null;
    const ts = parseInt(parts[2], 10);
    if (isNaN(ts) || Date.now() - ts > PROFILE_CACHE_TTL_MS) return null;
    return {
      language: parts[0] || null,
      deleted_at: parts[1] || null,
    };
  } catch {
    return null;
  }
}

function setProfileCache(
  response: NextResponse,
  language: string | null,
  deleted_at: string | null,
) {
  const value = `${language ?? ""}|${deleted_at ?? ""}|${Date.now()}`;
  response.cookies.set(PROFILE_CACHE_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const PUBLIC_PATHS = [
    "/",
    "/api/health",
    "/api/webhook",
    "/landing",
    "/privacy",
    "/terms",
    "/account/deleted",
  ];

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isAuthWelcome = request.nextUrl.pathname === "/auth/welcome";
  const isAuthResetPassword =
    request.nextUrl.pathname === "/auth/reset-password";
  const isOnboarding = request.nextUrl.pathname.startsWith("/onboarding");
  const isAccountDeleted = request.nextUrl.pathname === "/account/deleted";
  const isPublic =
    isAuthPage || PUBLIC_PATHS.includes(request.nextUrl.pathname);

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // For all authenticated users: check soft-deletion and language setup
  if (user && !isOnboarding && !isAccountDeleted) {
    // Use cached profile to avoid a DB round-trip on every request.
    // Cache is invalidated after 5 min or when profile changes (language/delete).
    let profile = readProfileCache(request);

    if (!profile) {
      const { data } = await supabase
        .from("profiles")
        .select("language, deleted_at")
        .eq("id", user.id)
        .single();
      profile = data
        ? { language: data.language, deleted_at: data.deleted_at }
        : null;
      if (profile) {
        setProfileCache(supabaseResponse, profile.language, profile.deleted_at);
      }
    }

    // Soft-deleted: sign out and redirect to /account/deleted (anywhere → deleted)
    if (profile?.deleted_at) {
      await supabase.auth.signOut();
      supabaseResponse.cookies.delete(PROFILE_CACHE_COOKIE);
      const url = new URL("/account/deleted", request.url);
      url.searchParams.set("since", profile.deleted_at);
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages (except the post-confirm welcome page and reset-password)
    if (isAuthPage && !isAuthWelcome && !isAuthResetPassword) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Redirect to language selection if not set (skip for welcome/reset-password)
    if (
      !isAuthWelcome &&
      !isAuthResetPassword &&
      profile &&
      profile.language === null
    ) {
      return NextResponse.redirect(
        new URL("/onboarding/language", request.url),
      );
    }
  }

  // Unauthenticated user on auth page: allow through
  if (!user && isAuthPage) {
    return supabaseResponse;
  }

  return supabaseResponse;
}
