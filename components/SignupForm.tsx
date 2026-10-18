"use client";

// Signup form. Password rules are shown under the field (design.md S-SIGNUP-W).
import { AlertCircle } from "lucide-react";
import { useFormState } from "react-dom";
import { signupAction } from "@/app/actions/auth";
import { PasswordInput } from "./PasswordInput";

const inputClass =
  "mt-1 h-12 w-full rounded-input border border-border bg-surface px-3 text-base text-text placeholder:text-muted";

export function SignupForm() {
  const [state, formAction] = useFormState(signupAction, { error: null });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={inputClass}
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>

      <PasswordInput
        id="password"
        name="password"
        label="Password"
        autoComplete="new-password"
        helper="At least 8 characters."
      />

      {state.error && (
        <p
          role="alert"
          className="inline-flex items-start gap-2 rounded-input bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <button
        type="submit"
        className="h-12 w-full rounded-input bg-accent px-4 text-base font-semibold text-white"
      >
        Create account
      </button>
    </form>
  );
}
