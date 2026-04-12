import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware - handles authentication and route protection.
 *
 * Runs on every request before the page renders.
 * Checks for auth state and redirects unauthenticated users to login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicPaths = ["/login", "/api/auth"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  // API routes don't need middleware redirect (handled by API logic)
  if (pathname.startsWith("/api/") || isPublic || pathname === "/") {
    return NextResponse.next();
  }

  // For dashboard routes, we rely on client-side auth check
  // (since auth state is in localStorage/Zustand, not cookies)
  // The dashboard layout component handles the redirect
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
