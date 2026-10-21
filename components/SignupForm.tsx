"use client";

// Signup form. Password rules are shown under the field (docs/design.md
// S-SIGNUP-W). Field styling comes from the shared primitives so the 54px
// input and 18px permanent label cannot drift.
import { AlertCircle, UserPlus } from "lucide-react";
import { useFormState } from "react-dom";
import { signupAction } from "@/app/actions/auth";
import { PasswordInput } from "./PasswordInput";
import { alertTone, btnPrimary, fieldLabel, input } from "./ui";

export function SignupForm() {
  const [state, formAction] = useFormState(signupAction, { error: null });

  return (
    <form action={formAction} className="mt-space-lg space-y-space-md">
      <div>
        <label htmlFor="name" className={fieldLabel}>
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={`${input} mt-1`}
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className={fieldLabel}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={`${input} mt-1`}
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
        <p role="alert" className={alertTone.danger}>
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <button type="submit" className={`${btnPrimary} w-full`}>
        <UserPlus className="h-6 w-6" aria-hidden="true" />
        Make an account
      </button>
    </form>
  );
}
