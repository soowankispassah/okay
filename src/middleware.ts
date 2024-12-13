import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/signup");

  // List of paths that don't require authentication
  const publicPaths = [
    "/auth/login",
    "/auth/signup",
    "/auth/verify",
    "/auth/verify-reset",
    "/auth/error",
    "/auth/complete-profile",
    "/auth/forgot-password",
    "/auth/reset-password"
  ];
  
  // If trying to access complete-profile page
  if (request.nextUrl.pathname === "/auth/complete-profile") {
    // If user is a Google user, redirect to home
    if (token?.provider === "google") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // If user is not authenticated and trying to access a protected route (including home page)
  if (!token && !publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}; 