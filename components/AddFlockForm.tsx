"use client";

// Add a flock (docs/03-hencount.md page 1). The server validates the name and
// refuses a duplicate with one sentence.
import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { createFlockAction, type FlockFormState } from "@/app/actions/eggs";

const INITIAL: FlockFormState = { error: null, saved: false, message: null };

const inputClass =
  "h-12 w-full rounded-input border border-border bg-surface px-3 text-base text-text placeholder:text-muted sm:w-64";

export function AddFlockForm() {
  const [state, formAction] = useFormState(createFlockAction, INITIAL);
  const [name, setName] = useState("");

  // Clear the box once the flock exists, ready for the next one.
  useEffect(() => {
    if (state.saved) setName("");
  }, [state.saved, state.message]);
  return (
    <form action={formAction} className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label htmlFor="flock-name" className="block text-sm font-medium text-text">
            New flock name
          </label>
          <input
            id="flock-name"
            name="name"
            type="text"
            required
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Mango Creek layers"
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-input bg-accent px-5 text-base font-semibold text-white"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Add flock
        </button>
      </div>

      {state.error && (
        <p
          role="alert"
          className="mt-3 inline-flex items-start gap-2 rounded-input bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}
      {state.saved && state.message && (
        <p
          role="status"
          className="mt-3 inline-flex items-center gap-2 rounded-input bg-success-bg px-3 py-2 text-sm font-medium text-success"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {state.message}
        </p>
      )}
    </form>
  );
}
