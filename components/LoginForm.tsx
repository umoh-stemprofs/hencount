"use client";

// Login form. The server action returns one plain sentence on failure;
// nothing crashes (docs/design.md §6). Field styling comes from the shared
// primitives so the 54px input and 18px permanent label cannot drift.
import { AlertCircle, LogIn } from "lucide-react";
import { useFormState } from "react-dom";
import { loginAction } from "@/app/actions/auth";
import { PasswordInput } from "./PasswordInput";
import { alertTone, btnPrimary, fieldLabel, input } from "./ui";

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, { error: null });

  return (
    <form action={formAction} className="mt-space-lg space-y-space-md">
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
          placeholder="farmer.john@farmmail.ng"
        />
      </div>

      <PasswordInput
        id="password"
        name="password"
        label="Password"
        autoComplete="current-password"
      />

      {state.error && (
        <p role="alert" className={alertTone.danger}>
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <button type="submit" className={`${btnPrimary} w-full`}>
        <LogIn className="h-6 w-6" aria-hidden="true" />
        Log in
      </button>
    </form>
  );
}
