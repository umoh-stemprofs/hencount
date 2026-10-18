// Tests for the auth helpers (docs 4A): signup validation, the wrong-password
// sentence, and that passwords are stored as bcrypt cost-10 hashes.
import { describe, expect, it } from "vitest";
import { AUTH_ERRORS, BCRYPT_COST, hashPassword, verifyPassword } from "./auth";
import { loginSchema, signupSchema } from "./validation";

describe("signupSchema", () => {
  it("accepts a valid signup and normalises name and email", () => {
    const parsed = signupSchema.safeParse({
      name: "  Ada Obi ",
      email: "  ADA@Example.com ",
      password: "demo1234",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Ada Obi");
      expect(parsed.data.email).toBe("ada@example.com");
      expect(parsed.data.password).toBe("demo1234");
    }
  });

  it("rejects a password shorter than 8 characters", () => {
    const parsed = signupSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "short",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toBe(
        "Password must be at least 8 characters.",
      );
    }
  });

  it("rejects an invalid email", () => {
    const parsed = signupSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      password: "demo1234",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toBe(
        "Enter a valid email address.",
      );
    }
  });

  it("rejects an empty name", () => {
    const parsed = signupSchema.safeParse({
      name: "   ",
      email: "ada@example.com",
      password: "demo1234",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toBe("Enter your name.");
    }
  });
});

describe("loginSchema", () => {
  it("requires a password", () => {
    const parsed = loginSchema.safeParse({ email: "ada@example.com", password: "" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toBe("Enter your password.");
    }
  });

  it("requires a valid email", () => {
    const parsed = loginSchema.safeParse({ email: "nope", password: "demo1234" });
    expect(parsed.success).toBe(false);
  });
});

describe("password storage", () => {
  it("stores passwords as bcrypt cost-10 hashes, never in clear text", async () => {
    const passHash = await hashPassword("demo1234");
    expect(passHash.startsWith(`$2b$${BCRYPT_COST}$`)).toBe(true);
    expect(passHash).not.toContain("demo1234");
    expect(await verifyPassword("demo1234", passHash)).toBe(true);
  });

  it("rejects the wrong password with one plain sentence", async () => {
    const passHash = await hashPassword("demo1234");
    expect(await verifyPassword("wrong-password", passHash)).toBe(false);
    expect(AUTH_ERRORS.wrongPassword).toBe("Wrong email or password. Try again.");
  });
});
