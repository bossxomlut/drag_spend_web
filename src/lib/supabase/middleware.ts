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
  const isOnboarding = request.nextUrl.pathname.startsWith("/onboarding");
  const isAccountDeleted = request.nextUrl.pathname === "/account/deleted";
  const isPublic =
    isAuthPage || PUBLIC_PATHS.includes(request.nextUrl.pathname);

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect to language selection if user hasn't picked a language yet
  if (user && !isOnboarding && !isAuthPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("language, deleted_at")
      .eq("id", user.id)
      .single();

    // Soft-deleted: redirect to account/deleted page (unless already there)
    if (profile?.deleted_at && !isAccountDeleted) {
      await supabase.auth.signOut();
      const url = new URL("/account/deleted", request.url);
      url.searchParams.set("since", profile.deleted_at);
      return NextResponse.redirect(url);
    }

    if (profile && profile.language === null && !isAccountDeleted) {
      return NextResponse.redirect(
        new URL("/onboarding/language", request.url),
      );
    }
  }

  return supabaseResponse;
}
