"use client";

// Password field with a show/hide toggle (docs/design.md S-LOGIN-W),
// matching the mockup: a 54px field, an 18px permanent label above it, and
// an inside-right toggle that says "Show"/"Hide" in words rather than relying
// on a bare eye icon.
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { fieldLabel, helper, input } from "./ui";

export function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  helper: helperText,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  helper?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={name === "password" ? 8 : undefined}
          className={`${input} pr-24`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-chip border border-border-strong bg-[#F2F4F7] px-3 text-label-base text-text transition-colors hover:bg-border"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{visible ? "Hide" : "Show"}</span>
        </button>
      </div>
      {helperText && <p className={helper}>{helperText}</p>}
    </div>
  );
}
