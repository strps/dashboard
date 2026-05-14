import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_ROUTE_PREFIXES = ["/sign-in", "/sign-up"];

// Optimistic gate only: `getSessionCookie` checks for the cookie's presence,
// not its signature or DB state. A stale/foreign cookie (e.g. left over from
// another app on the same localhost port) will pass. Real authorization must
// happen at the data layer via `auth.api.getSession`.
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!sessionCookie && !isPublic) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  if (sessionCookie && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
