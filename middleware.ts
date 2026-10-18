// Every page except /login and /signup needs a session (00-global.md §3).
// This is the first lock; every server action and read re-checks ownership
// again (lib/session.ts, lib/data.ts).
import { getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";
import { sessionOptions } from "@/lib/session-config";
import type { SessionData } from "@/lib/session";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  const isPublic = PUBLIC_PATHS.has(pathname);

  // Signed out and heading somewhere private → login page.
  if (!isPublic && !session.userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Signed in and visiting login/signup → the dashboard.
  if (isPublic && session.userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Pages only: skip API routes, Next internals and any file with an
  // extension (favicon, images).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
