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
import { btnPrimary, btnSecondary } from "./ui";
import { StepBar } from "./StepBar";

const INITIAL: DayLogState = {
  error: null,
  field: null,
  saved: false,
  updated: false,
  message: null,
};

// DESIGN.md "Input Fields & Steppers": the value reads at display-stat
// (40px) and the flanking tap targets are a full 56x56 so they work with
// gloves or damp hands. Typing still works — the number box is a real input.
const stepperBtn =
  "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-card border-2 border-border-strong bg-surface text-text transition-colors hover:bg-bg active:brightness-95";
const inputClass =
  "h-16 min-w-0 flex-1 rounded-card border-2 border-border-strong bg-surface px-2 text-center text-display-stat tabular-nums text-text focus:border-accent";

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
      <label htmlFor={`log-${id}`} className="block text-label-lg text-text">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-space-sm">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()} by ${id === "feedKg" ? "half a kilogram" : "1"}`}
          onClick={() => bump(id === "feedKg" ? -0.5 : -1)}
          className={stepperBtn}
        >
          <Minus className="h-6 w-6" aria-hidden="true" />
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
          aria-label={`Increase ${label.toLowerCase()} by ${id === "feedKg" ? "half a kilogram" : "1"}`}
          onClick={() => bump(id === "feedKg" ? 0.5 : 1)}
          className={stepperBtn}
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </button>
        <span className="text-body-lg-bold text-muted">{unit}</span>
      </div>
      <p className="mt-1 text-body-base leading-6 text-muted">{helper}</p>
    </div>
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"      className="mt-2 inline-flex items-start gap-2 rounded-input border-2 border-[#FECDCA] bg-danger-bg p-space-md text-body-base font-semibold text-danger"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
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
  // A server refusal disappears as soon as the user edits an input, so an old
  // message never lingers next to a corrected number.
  const [edited, setEdited] = useState(false);
  useEffect(() => setEdited(false), [state]);
  const serverError = edited ? null : state.error;
  // The same two rules as the server, checked when Next is pressed so the
  // user is stopped on step 1 instead of after filling in the feed too.
  const [stepOneError, setStepOneError] = useState<{
    message: string;
    field: "hens" | "eggs";
  } | null>(null);

  const editHens = (next: string) => {
    setEdited(true);
    setStepOneError(null);
    setHens(next);
  };
  const editEggs = (next: string) => {
    setEdited(true);
    setStepOneError(null);
    setEggs(next);
  };
  const editFeed = (next: string) => {
    setEdited(true);
    setFeedKg(next);
  };

  const checkStepOne = (): boolean => {
    const h = Number(hens);
    const e = Number(eggs);
    if (!Number.isInteger(h) || h < 1) {
      setStepOneError({
        message: "Hens must be a whole number of at least 1.",
        field: "hens",
      });
      return false;
    }
    if (!Number.isInteger(e) || e < 0) {
      setStepOneError({
        message: "Eggs must be a whole number of 0 or more.",
        field: "eggs",
      });
      return false;
    }
    if (e > h) {
      setStepOneError({ message: "Eggs cannot be more than hens.", field: "eggs" });
      return false;
    }
    setStepOneError(null);
    return true;
  };

  // A server refusal belongs on the step that holds that field.
  useEffect(() => {
    if (state.field === "hens" || state.field === "eggs") setStep(1);
    if (state.field === "feedKg") setStep(2);
  }, [state.field, state.error]);

  if (state.saved) {
    return (
      <div className="mt-6 rounded-card border border-border bg-surface p-space-lg shadow-card">
        <p
          role="status"
          className="inline-flex items-center gap-2 text-headline-lg text-success"
        >
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          {state.message}
        </p>
        <p className="mt-2 text-body-lg leading-7 text-muted">
          {state.updated
            ? "The numbers for today were replaced with what you just entered."
            : `Today's numbers for ${flockName} are saved.`}
        </p>
        <div className="mt-space-lg flex flex-wrap gap-space-sm">
          <Link href={`/eggs/${flockId}/advice`} className={btnPrimary}>
            See advice
          </Link>
          <Link href="/eggs" className={btnSecondary}>
            Back to flocks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-6 max-w-[560px] rounded-card border border-border bg-surface p-space-lg shadow-card"
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
          onChange={editHens}
          unit="hens"
          helper="How many hens were in this flock today."
          step={1}
        />
        <Stepper
          id="eggs"
          label="Eggs collected"
          value={eggs}
          onChange={editEggs}
          unit="eggs"
          helper="A hen can lay at most one egg a day."
          step={1}
        />
        {serverError && state.field === "eggs" && <ErrorLine>{serverError}</ErrorLine>}
        {serverError && state.field === "hens" && <ErrorLine>{serverError}</ErrorLine>}
        {stepOneError && <ErrorLine>{stepOneError.message}</ErrorLine>}
      </div>

      <div hidden={step !== 2} className="mt-6 space-y-5">
        <Stepper
          id="feedKg"
          label="Feed used today"
          value={feedKg}
          onChange={editFeed}
          unit="kg"
          helper="Feed given to this flock today, in kilograms."
          step={0.1}
        />
        {serverError && state.field === "feedKg" && <ErrorLine>{serverError}</ErrorLine>}
        <p className="text-body-base leading-6 text-muted">
          These numbers stay on this page, so nothing is lost if you go back.
        </p>
      </div>

      {serverError && state.field === null && <ErrorLine>{serverError}</ErrorLine>}

      <div className="mt-space-lg flex flex-wrap gap-space-sm">
        {step === 1 ? (
          <button
            type="button"
            onClick={() => {
              if (checkStepOne()) setStep(2);
            }}
            className={btnPrimary}
          >
            Next
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <>
            <button type="button" onClick={() => setStep(1)} className={btnSecondary}>
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              Back
            </button>
            <button type="submit" className={btnPrimary}>
              Save today&apos;s log
            </button>
          </>
        )}
      </div>
    </form>
  );
}
