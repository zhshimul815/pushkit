import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { SECURITY_HEADERS } from "@/lib/security";

/**
 * Next.js 16 Proxy (formerly Middleware).
 * Optimistic auth check only: presence of the session cookie gates
 * /dashboard/*. Full session validation happens in the dashboard layout.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = pathname.startsWith("/dashboard")
    ? gate(request)
    : NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    // The media route sets its own stricter CSP (sandbox) for uploaded
    // files; the app-wide policy would override it here, so skip it there.
    if (key === "Content-Security-Policy" && pathname.startsWith("/api/media/")) continue;
    response.headers.set(key, value);
  }
  return response;
}

function gate(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
