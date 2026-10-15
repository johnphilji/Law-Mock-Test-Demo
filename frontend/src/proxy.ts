import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

// Route configurations
const studentProtectedPrefixes = ["/dashboard", "/tests", "/checkout", "/results", "/test"];
const adminProtectedPrefix = "/admin";
const adminLoginPath = "/admin/login";
const authPages = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve session token from cookies
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isStudentRoute = studentProtectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAdminRoute = pathname === adminProtectedPrefix || pathname.startsWith(`${adminProtectedPrefix}/`);
  const isAdminLogin = pathname === adminLoginPath;
  const isAuthPage = authPages.includes(pathname);

  // 1. Admin route protection
  if (isAdminRoute) {
    if (isAdminLogin) {
      // If already logged in as admin, redirect to admin portal
      if (session && session.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // Require authentication
    if (!session) {
      const loginUrl = new URL(adminLoginPath, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Require ADMIN role - Students attempting to access admin are redirected to student dashboard
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // 2. Student route protection
  if (isStudentRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Prevent authenticated users from visiting /login or /register
  if (isAuthPage && session) {
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - API routes (/api/*)
     * - Next.js internal files (_next/static, _next/image)
     * - Public assets and images (favicon.ico, png, svg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export default proxy;
