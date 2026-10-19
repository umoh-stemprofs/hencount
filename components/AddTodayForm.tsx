"use client";

// "Add today" wizard (docs/03-hencount.md page 3, design.md S-ADD-STOCK
// pattern): step 1 of 2 hens and eggs, step 2 of 2 feed in kg. Both steps are
// always in the form so Save sends every number at once; the server is the
// only judge of the rules ("Eggs cannot be more than hens." lands next to
// the eggs field).
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { saveDayLogAction, type DayLogState } from "@/app/actions/eggs";
import { StepBar } from "./StepBar";

const INITIAL: DayLogState = {
  error: null,
  field: null,
  saved: false,
  updated: false,
  message: null,
};

const inputClass =
  "h-12 w-24 rounded-input border border-border bg-surface text-center text-base tabular-nums text-text";

function Stepper({
  id,
  label,
  value,
  onChange,
  unit,
  helper,
  step,
}: {
  id: "hens" | "eggs" | "feedKg";
  label: string;
  value: string;
  onChange: (next: string) => void;
  unit: string;
  helper: string;
  step: number;
}) {
  const numeric = Number(value);
  const current = Number.isFinite(numeric) ? numeric : 0;
  const bump = (by: number) => {
    const next = Math.max(0, current + by);
    onChange(id === "feedKg" ? String(Math.round(next * 10) / 10) : String(Math.round(next)));
  };

  return (
    <div>
      <label htmlFor={`log-${id}`} className="block text-sm font-medium text-text">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          aria-label={`Less ${label.toLowerCase()}`}
          onClick={() => bump(id === "feedKg" ? -0.5 : -1)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-input border border-border bg-surface text-text hover:bg-bg"
        >
          <Minus className="h-5 w-5" aria-hidden="true" />
        </button>
        <input
          id={`log-${id}`}
          name={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          onClick={() => bump(id === "feedKg" ? 0.5 : 1)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-input border border-border bg-surface text-text hover:bg-bg"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="text-sm text-muted">{unit}</span>
      </div>
      <p className="mt-1 text-sm text-muted">{helper}</p>
    </div>
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-2 inline-flex items-start gap-2 rounded-input bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

export function AddTodayForm({
  flockId,
  flockName,
  initial,
}: {
  flockId: string;
  flockName: string;
  initial: { hens: number; eggs: number; feedKg: number } | null;
}) {
  const [state, formAction] = useFormState(saveDayLogAction, INITIAL);
  const [step, setStep] = useState<1 | 2>(1);
  const [hens, setHens] = useState(initial ? String(initial.hens) : "100");
  const [eggs, setEggs] = useState(initial ? String(initial.eggs) : "");
  const [feedKg, setFeedKg] = useState(initial ? String(initial.feedKg) : "");

  // A server refusal belongs on the step that holds that field.
  useEffect(() => {
    if (state.field === "hens" || state.field === "eggs") setStep(1);
    if (state.field === "feedKg") setStep(2);
  }, [state.field, state.error]);

  if (state.saved) {
    return (
      <div className="mt-6 rounded-card border border-border bg-surface p-6 shadow-card">
        <p
          role="status"
          className="inline-flex items-center gap-2 text-lg font-semibold text-success"
        >
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          {state.message}
        </p>
        <p className="mt-2 text-base leading-6 text-muted">
          {state.updated
            ? "The numbers for today were replaced with what you just entered."
            : `Today's numbers for ${flockName} are saved.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/eggs/${flockId}/advice`}
            className="inline-flex h-12 items-center rounded-input bg-accent px-4 text-base font-semibold text-white"
          >
            See advice
          </Link>
          <Link
            href="/eggs"
            className="inline-flex h-12 items-center rounded-input border border-border bg-surface px-4 text-base font-semibold text-text hover:bg-bg"
          >
            Back to flocks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-6 max-w-[560px] rounded-card border border-border bg-surface p-6 shadow-card"
    >
      <input type="hidden" name="flockId" value={flockId} />
      <StepBar
        step={step}
        total={2}
        label={step === 1 ? "Hens and eggs" : "Feed used"}
      />

      <div hidden={step !== 1} className="mt-6 space-y-5">
        <Stepper
          id="hens"
          label="Hens today"
          value={hens}
          onChange={setHens}
          unit="hens"
          helper="How many hens were in this flock today."
          step={1}
        />
        <Stepper
          id="eggs"
          label="Eggs collected"
          value={eggs}
          onChange={setEggs}
          unit="eggs"
          helper="A hen can lay at most one egg a day."
          step={1}
        />
        {state.error && state.field === "eggs" && <ErrorLine>{state.error}</ErrorLine>}
        {state.error && state.field === "hens" && <ErrorLine>{state.error}</ErrorLine>}
      </div>

      <div hidden={step !== 2} className="mt-6 space-y-5">
        <Stepper
          id="feedKg"
          label="Feed used today"
          value={feedKg}
          onChange={setFeedKg}
          unit="kg"
          helper="Feed given to this flock today, in kilograms."
          step={0.1}
        />
        {state.error && state.field === "feedKg" && <ErrorLine>{state.error}</ErrorLine>}
        <p className="text-sm leading-6 text-muted">
          These numbers stay on this page, so nothing is lost if you go back.
        </p>
      </div>

      {state.error && state.field === null && <ErrorLine>{state.error}</ErrorLine>}

      <div className="mt-6 flex flex-wrap gap-3">
        {step === 1 ? (
          <button
            type="button"
            onClick={() => setStep(2)}
            className="inline-flex h-12 items-center gap-2 rounded-input bg-accent px-5 text-base font-semibold text-white"
          >
            Next
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex h-12 items-center gap-2 rounded-input border border-border bg-surface px-4 text-base font-semibold text-text hover:bg-bg"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
            <button
              type="submit"
              className="inline-flex h-12 items-center rounded-input bg-accent px-5 text-base font-semibold text-white"
            >
              Save today&apos;s log
            </button>
          </>
        )}
      </div>
    </form>
  );
}
