"use client";

import { useMemo, useState } from "react";

type VerifiedAddress = {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
};

export default function AddressVerification({
  onVerified,
  submitClassName,
  cancelClassName,
  onCancel,
  title = "Verify Property Address",
  helperText = "Please verify the property address to accept this invitation:",
}: {
  onVerified: (addr: VerifiedAddress) => void;
  submitClassName?: string;
  cancelClassName?: string;
  onCancel?: () => void;
  title?: string;
  helperText?: string;
}) {
  const [street, setStreet] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(street.trim() && city.trim() && state.trim() && zip.trim());
  }, [street, city, state, zip]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      onVerified({
        street: street.trim(),
        unit: unit.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
      });
    } finally {
      // parent can keep it open while request runs; we still unlock the form locally
      setSubmitting(false);
    }
  }

  const fieldShell =
    "rounded-2xl border border-white/20 bg-black/35 backdrop-blur transition-colors overflow-hidden " +
    "focus-within:border-[#33C17D] focus-within:border-2";
  const fieldInner =
    "w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40 border-0 ring-0 focus:ring-0 focus:outline-none";
  const inputInner = `${fieldInner} px-4 py-2`;
  const labelCaps = "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55";

  const defaultSubmit =
    "inline-flex items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/15 disabled:opacity-60";
  const defaultCancel =
    "inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/10";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/70">{helperText}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelCaps}>Street</label>
          <div className={fieldShell}>
            <input
              className={inputInner}
              placeholder="123 Main St"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              autoComplete="street-address"
            />
          </div>
        </div>

        <div>
          <label className={labelCaps}>Unit</label>
          <div className={fieldShell}>
            <input
              className={inputInner}
              placeholder="Apt 4B (optional)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              autoComplete="address-line2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className={labelCaps}>City</label>
            <div className={fieldShell}>
              <input
                className={inputInner}
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
              />
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className={labelCaps}>State</label>
            <div className={fieldShell}>
              <input
                className={inputInner}
                placeholder="ST"
                value={state}
                onChange={(e) => setState(e.target.value)}
                autoComplete="address-level1"
              />
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className={labelCaps}>ZIP</label>
            <div className={fieldShell}>
              <input
                className={inputInner}
                placeholder="ZIP"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                autoComplete="postal-code"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-2">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className={cancelClassName ?? defaultCancel}
            >
              Cancel
            </button>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={submitClassName ?? defaultSubmit}
          >
            {submitting ? "Verifying…" : "Verify & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}