import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/profile", "/create", "/analytics", "/messages"];

// Routes that should redirect authenticated users (like login/signup)
const authRoutes = ["/auth/signin", "/auth/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get Supabase session tokens from cookies
  const accessToken = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;
  const supabaseAuthToken = request.cookies.get("supabase.auth.token")?.value;

  // Check if user is authenticated (has any of the auth tokens)
  const isAuthenticated = !!(accessToken || refreshToken || supabaseAuthToken);

  // Protect authenticated-only routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo");
      return NextResponse.redirect(new URL(redirectTo || "/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/create/:path*",
    "/analytics/:path*",
    "/messages/:path*",
    "/auth/signin",
    "/auth/signup",
  ],
};
