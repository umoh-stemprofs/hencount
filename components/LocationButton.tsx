"use client";

// "Use my location" is optional (design.md S-FARM): it fills the latitude
// and longitude fields from the browser; typing them always works.
import { LocateFixed } from "lucide-react";
import { useState } from "react";

function setField(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

export function LocationButton() {
  const [message, setMessage] = useState<string | null>(null);

  function handleClick(): void {
    if (!("geolocation" in navigator)) {
      setMessage("This browser cannot share a location. Enter the coordinates instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setField("farm-lat", position.coords.latitude.toFixed(4));
        setField("farm-lon", position.coords.longitude.toFixed(4));
        setMessage(null);
      },
      () => {
        setMessage("Could not get your location. Enter the coordinates instead.");
      },
      { timeout: 8_000, maximumAge: 60_000 },
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex h-12 items-center gap-2 rounded-input border border-border bg-surface px-4 text-sm font-semibold text-text hover:bg-bg"
      >
        <LocateFixed className="h-4 w-4" aria-hidden="true" />
        Use my location
      </button>
      {message && <p className="mt-2 text-sm text-muted">{message}</p>}
    </div>
  );
}
