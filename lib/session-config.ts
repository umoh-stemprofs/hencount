// iron-session options, shared by middleware (edge) and server code.
// SESSION_SECRET lives only in .env (git-ignored) and is never printed.
import type { SessionOptions } from "iron-session";

export const SESSION_COOKIE = "hencount_session";

const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error(
    "SESSION_SECRET is missing. Add it to .env (see .env.example) and restart the dev server.",
  );
}

export const sessionOptions: SessionOptions = {
  password: secret,
  cookieName: SESSION_COOKIE,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
  // 7 days.
  ttl: 60 * 60 * 24 * 7,
};
