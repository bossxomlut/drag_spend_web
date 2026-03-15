import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
    "/landing",
    "/privacy",
    "/terms",
    "/account/deleted",
  ];

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isAuthWelcome = request.nextUrl.pathname === "/auth/welcome";
  const isOnboarding = request.nextUrl.pathname.startsWith("/onboarding");
  const isAccountDeleted = request.nextUrl.pathname === "/account/deleted";
  const isPublic =
    isAuthPage || PUBLIC_PATHS.includes(request.nextUrl.pathname);

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // For all authenticated users: check soft-deletion and language setup
  if (user && !isOnboarding && !isAccountDeleted) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("language, deleted_at")
      .eq("id", user.id)
      .single();

    // Soft-deleted: sign out and redirect to /account/deleted (anywhere → deleted)
    if (profile?.deleted_at) {
      await supabase.auth.signOut();
      const url = new URL("/account/deleted", request.url);
      url.searchParams.set("since", profile.deleted_at);
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages (except the post-confirm welcome page)
    if (isAuthPage && !isAuthWelcome) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Redirect to language selection if not set (skip for welcome — user goes there via CTA)
    if (!isAuthWelcome && profile && profile.language === null) {
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
