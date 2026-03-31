// src/middleware.js
// ─────────────────────────────────────────────────────────────────────────────
// Edge middleware: enforces a session cookie set by /api/auth/session.
// Firebase auth state lives in localStorage (client-only), so we use a
// lightweight HttpOnly session cookie to protect server-rendered routes.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";

// Routes that logged-out users are allowed to visit
const PUBLIC_PATHS = ["/login", "/onboarding"];

// Routes that logged-in users should be bounced away from
const AUTH_PATHS   = ["/login"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")   ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("fueltrack_session")?.value;
  const isPublicPath  = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath    = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Not logged in → redirect to login (except for public paths)
  if (!sessionCookie && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname); // Preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in → bounce away from /login
  if (sessionCookie && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};