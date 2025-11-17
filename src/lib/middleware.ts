// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow these paths without authentication
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/api/auth",
    "/api/register",
    "/api/property",
    "/_next",
    "/favicon.ico",
  ];

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected routes, check for session
  const token = request.cookies.get("next-auth.session-token") ||
                request.cookies.get("__Secure-next-auth.session-token");

  if (!token) {
    // Redirect to root landing page, not /home
    const rootUrl = new URL("/", request.url);
    return NextResponse.redirect(rootUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};