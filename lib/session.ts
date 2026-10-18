// Session helpers for server components and server actions.
// Every action re-checks the session itself (00-global.md §3 security).
import "server-only";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions } from "./session-config";

export interface SessionData {
  userId?: string;
  email?: string;
  name?: string;
}

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
}

export async function getSession() {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session.userId) return null;
  return {
    userId: session.userId,
    email: session.email ?? "",
    name: session.name ?? "",
  };
}

/** Redirects to /login when there is no session. Use in protected pages. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function startSession(user: {
  userId: string;
  email: string;
  name: string;
}): Promise<void> {
  const session = await getSession();
  session.userId = user.userId;
  session.email = user.email;
  session.name = user.name;
  await session.save();
}

export async function endSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
