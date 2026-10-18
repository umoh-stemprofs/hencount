"use client";

// Password field with a show/hide toggle (design.md S-LOGIN-W).
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  helper,
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
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={name === "password" ? 8 : undefined}
          className="mt-1 h-12 w-full rounded-input border border-border bg-surface px-3 pr-12 text-base text-text placeholder:text-muted"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center rounded-input text-muted hover:text-text"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {helper && <p className="mt-1 text-sm text-muted">{helper}</p>}
    </div>
  );
}
