import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

// ─── Route definitions ────────────────────────────────────────────────────────

const PUBLIC_ROUTES = ["/login"];

const ROLE_ROUTES: Record<string, string> = {
  "/dashboard/client": "CLIENT",
  "/dashboard/admin": "ADMIN",
};

// ─── Proxy ────────────────────────────────────────────────────────────────────

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and Next.js internals to pass through
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Read session token from cookie (optimistic — no DB call)
  const token = request.cookies.get("b2b_session")?.value;
  const session = await decrypt(token);

  // 1. Unauthenticated user trying to access a protected route → login
  if (!isPublicRoute && !session) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user on a login page → redirect to their dashboard
  if (isPublicRoute && session) {
    const dest =
      session.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/client";
    return NextResponse.redirect(new URL(dest, request.nextUrl));
  }

  // 3. Role-based access control for dashboard routes
  if (session) {
    for (const [routePrefix, requiredRole] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(routePrefix) && session.role !== requiredRole) {
        // Wrong role — redirect to their own dashboard
        const dest =
          session.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/client";
        return NextResponse.redirect(new URL(dest, request.nextUrl));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - /public/uploads (uploaded files served as static assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|uploads).*)",
  ],
};
