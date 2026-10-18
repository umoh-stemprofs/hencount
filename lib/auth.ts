// Password helpers (bcrypt cost 10, 00-global.md §3) and the exact error
// sentences the auth forms show — one plain sentence, no crash.
import { compare, hash } from "bcryptjs";
import type { ZodError } from "zod";

export const BCRYPT_COST = 10;

export const AUTH_ERRORS = {
  wrongPassword: "Wrong email or password. Try again.",
  emailTaken: "That email is already used. Try another.",
  demoOff: "The demo account is turned off. Create your own account instead.",
  demoMissing: "The demo account is not set up yet. Create your own account instead.",
  unexpected: "Something went wrong. Try again.",
} as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  passHash: string,
): Promise<boolean> {
  return compare(password, passHash);
}

/** First Zod issue's sentence, for one-line form errors. */
export function firstIssue(error: ZodError): string {
  return error.issues[0]?.message ?? "Check your entries and try again.";
}
