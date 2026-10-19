"use client";

// Rename and delete for one flock. Delete always asks first, and the dialog
// spells out that the daily logs and sales go with it (design.md §2:
// confirm dialog with two buttons, verbs not Yes/No).
import { AlertCircle, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
  deleteFlockAction,
  renameFlockAction,
  type FlockFormState,
} from "@/app/actions/eggs";

const INITIAL: FlockFormState = { error: null, saved: false, message: null };

const inputClass =
  "mt-1 h-12 w-full rounded-input border border-border bg-surface px-3 text-base text-text";

function DialogShell({
  titleId,
  title,
  onClose,
  children,
}: {
  titleId: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-text/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-dialog bg-surface p-6 shadow-[0_12px_24px_-4px_rgba(16,24,40,.16)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-xl font-semibold text-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-12 w-12 items-center justify-center rounded-input text-muted hover:bg-bg"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorLine({ text }: { text: string }) {
  return (
    <p
      role="alert"
      className="mt-3 inline-flex items-start gap-2 rounded-input bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {text}
    </p>
  );
}

export function FlockCardActions({
  flockId,
  flockName,
}: {
  flockId: string;
  flockName: string;
}) {
  const [open, setOpen] = useState<null | "rename" | "delete">(null);
  const [renameState, renameAction] = useFormState(renameFlockAction, INITIAL);
  const [deleteState, deleteAction] = useFormState(deleteFlockAction, INITIAL);

  useEffect(() => {
    if (renameState.saved) setOpen(null);
  }, [renameState.saved]);

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen("rename")}
          className="inline-flex h-12 items-center gap-2 rounded-input px-3 text-sm font-medium text-muted hover:bg-bg hover:text-text"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Rename
        </button>
        <button
          type="button"
          onClick={() => setOpen("delete")}
          className="inline-flex h-12 items-center gap-2 rounded-input px-3 text-sm font-medium text-danger hover:bg-danger-bg"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </button>
      </div>

      {open === "rename" && (
        <DialogShell
          titleId={`rename-${flockId}`}
          title="Rename flock"
          onClose={() => setOpen(null)}
        >
          <form action={renameAction} className="mt-4">
            <input type="hidden" name="flockId" value={flockId} />
            <label htmlFor={`name-${flockId}`} className="block text-sm font-medium text-text">
              Flock name
            </label>
            <input
              key={flockName}
              id={`name-${flockId}`}
              name="name"
              type="text"
              required
              maxLength={40}
              defaultValue={flockName}
              className={inputClass}
            />
            {renameState.error && <ErrorLine text={renameState.error} />}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                className="h-12 rounded-input bg-accent px-4 text-base font-semibold text-white"
              >
                Save name
              </button>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="h-12 rounded-input border border-border bg-surface px-4 text-base font-semibold text-text hover:bg-bg"
              >
                Keep as is
              </button>
            </div>
          </form>
        </DialogShell>
      )}

      {open === "delete" && (
        <DialogShell
          titleId={`delete-${flockId}`}
          title={`Delete ${flockName}?`}
          onClose={() => setOpen(null)}
        >
          <p className="mt-2 text-base leading-6 text-muted">
            This deletes the flock and every daily log and egg sale saved for
            it. It cannot be undone.
          </p>
          <form action={deleteAction} className="mt-5">
            <input type="hidden" name="flockId" value={flockId} />
            {deleteState.error && <ErrorLine text={deleteState.error} />}
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="submit"
                className="h-12 rounded-input bg-danger px-4 text-base font-semibold text-white"
              >
                Delete flock
              </button>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="h-12 rounded-input border border-border bg-surface px-4 text-base font-semibold text-text hover:bg-bg"
              >
                Keep flock
              </button>
            </div>
          </form>
        </DialogShell>
      )}
    </>
  );
}
