import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { REF_COOKIE_NAME, REF_COOKIE_TTL_SECONDS } from "./src/lib/constants";

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session tokens
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;

  // Affiliate ref cookie: textbox prefill memo for the signup form.
  // Last-touch wins — overwrite freely. Not an attribution boundary.
  const refParam = searchParams.get("ref") || searchParams.get("code");
  if (refParam && /^[A-Z0-9]{4,16}$/i.test(refParam)) {
    supabaseResponse.cookies.set(REF_COOKIE_NAME, refParam.toUpperCase(), {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: REF_COOKIE_TTL_SECONDS,
      httpOnly: false, // signup form reads it via document.cookie
    });
  }

  // Protected dashboard routes: redirect to login if no user
  if (pathname.startsWith("/d") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Affiliate dashboard: requires login
  if (pathname.startsWith("/affiliate/dashboard") ||
      pathname.startsWith("/affiliate/codes") ||
      pathname.startsWith("/affiliate/referrals") ||
      pathname.startsWith("/affiliate/earnings") ||
      pathname.startsWith("/affiliate/profile")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Auth routes: redirect to dashboard if user exists
  if ((pathname === "/login" || pathname === "/signup") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/d/select-role";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/d/:path*", "/affiliate/:path*", "/login", "/signup", "/", "/pricing", "/blog/:path*"],
};
