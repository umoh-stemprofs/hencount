// Auth server actions. Every input is validated with Zod on the server
// (00-global.md §2); passwords are bcrypt cost-10 hashes; the wrong
// password shows one plain sentence and never crashes (design.md §6).
"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AUTH_ERRORS, firstIssue, hashPassword, verifyPassword } from "@/lib/auth";
import { startSession, endSession } from "@/lib/session";
import { loginSchema, signupSchema } from "@/lib/validation";

/** The demo farmer from prisma/seed.ts — the only account demo login uses. */
const DEMO_EMAIL = "demo@hencount.test";

export interface AuthFormState {
  error: string | null;
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  let user;
  try {
    const existing = await db.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) return { error: AUTH_ERRORS.emailTaken };

    const passHash = await hashPassword(parsed.data.password);
    user = await db.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, passHash },
    });
  } catch (error) {
    // Infrastructure failure (e.g. database unreachable): one plain
    // sentence, no crash (design.md §6).
    console.error("Signup could not reach the database:", error);
    return { error: AUTH_ERRORS.unexpected };
  }

  await startSession({ userId: user.id, email: user.email, name: user.name });
  redirect("/");
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  let user;
  try {
    user = await db.user.findUnique({
      where: { email: parsed.data.email },
    });
  } catch (error) {
    // Infrastructure failure (e.g. database unreachable): one plain
    // sentence, no crash (design.md §6).
    console.error("Login could not reach the database:", error);
    return { error: AUTH_ERRORS.unexpected };
  }
  const ok = user
    ? await verifyPassword(parsed.data.password, user.passHash)
    : false;
  // One sentence for both "no such email" and "wrong password".
  if (!user || !ok) return { error: AUTH_ERRORS.wrongPassword };

  await startSession({ userId: user.id, email: user.email, name: user.name });
  redirect("/");
}

/** "Try demo account" — only offered when DEMO_MODE=true (00-global.md §4). */
export async function demoLoginAction(): Promise<void> {
  if (process.env.DEMO_MODE !== "true") redirect("/login?error=demo-off");

  let user;
  try {
    user = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
  } catch (error) {
    console.error("Demo login could not reach the database:", error);
    redirect("/login?error=unexpected");
  }
  if (!user) redirect("/login?error=demo-missing");

  await startSession({ userId: user.id, email: user.email, name: user.name });
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/login");
}
