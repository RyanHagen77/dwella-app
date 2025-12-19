// app/home/_components/AddRecordModal.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Button, GhostButton } from "@/components/ui/Button";
import { uid } from "@/lib/storage";
import { useToast } from "@/components/ui/Toast";
import { textMeta } from "@/lib/glass";

type RecordType = "record" | "reminder" | "warranty";

/** Unified payload for all record types */
export type UnifiedRecordPayload = {
  id: string;
  type: RecordType;
  // Common fields
  title: string;
  note?: string;
  // Record-specific
  date?: string;
  category?: string;
  vendor?: string;
  cost?: number;
  verified?: boolean;
  kind?: string;
  // Reminder-specific
  dueAt?: string;
  // Warranty-specific
  item?: string;
  provider?: string;
  expiresAt?: string;
  purchasedAt?: string;
};

type Props = {
  open: boolean;
  onCloseAction: () => void;
  onCreateAction: (args: { payload: UnifiedRecordPayload; files: File[] }) => void;
  defaultType?: RecordType;
};

/** Match your clean service-record controls */
const fieldShell =
  "rounded-2xl border border-white/20 bg-black/35 backdrop-blur transition " +
  "focus-within:border-[#33C17D] focus-within:border-2 " +
  "focus-within:shadow-[0_0_0_1px_rgba(51,193,125,0.35)]";

/**
 * IMPORTANT: text-base on mobile prevents iOS Safari auto-zoom (modal “opens wide”).
 * Keep text-sm on desktop via sm:text-sm.
 */
const fieldInner =
  "w-full bg-transparent px-4 py-2 text-white outline-none placeholder:text-white/35 " +
  "border-0 ring-0 focus:ring-0 focus:outline-none " +
  "text-base sm:text-sm";

const selectInner = fieldInner + " appearance-none pr-10";

const textareaInner =
  "w-full bg-transparent px-4 py-3 text-white outline-none placeholder:text-white/35 " +
  "border-0 ring-0 focus:ring-0 focus:outline-none resize-none min-h-[110px] " +
  "text-base sm:text-sm";

const labelCaps =
  "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55";

export function AddRecordModal({
  open,
  onCloseAction: onClose,
  onCreateAction: onCreate,
  defaultType = "record",
}: Props) {
  const { push } = useToast();
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  const stepLabels = React.useMemo(() => ["Type", "Upload", "Details", "Review"], []);
  const maxSteps = stepLabels.length;

  const [recordType, setRecordType] = React.useState<RecordType>(defaultType);
  const [step, setStep] = React.useState(1);

  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [form, setForm] = React.useState({
    // Record fields
    title: "",
    date: today,
    category: "Maintenance",
    vendor: "",
    cost: "", // keep as string to avoid input fighting
    verified: false,
    note: "",
    // Reminder fields
    dueAt: today,
    // Warranty fields
    item: "",
    provider: "",
    expiresAt: "",
    purchasedAt: today,
  });

  // Revoke previews on unmount (safety)
  React.useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  // Reset when modal opens
  React.useEffect(() => {
    if (!open) return;

    previews.forEach((u) => URL.revokeObjectURL(u));

    setRecordType(defaultType);
    setStep(1);
    setFiles([]);
    setPreviews([]);
    setForm({
      title: "",
      date: today,
      category: "Maintenance",
      vendor: "",
      cost: "",
      verified: false,
      note: "",
      dueAt: today,
      item: "",
      provider: "",
      expiresAt: "",
      purchasedAt: today,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultType, today]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onFiles(list: FileList | null) {
    if (!list) return;

    previews.forEach((u) => URL.revokeObjectURL(u));

    const arr = Array.from(list);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(index: number) {
    const url = previews[index];
    if (url) URL.revokeObjectURL(url);
    setFiles((f) => f.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  }

  const next = () => setStep((s) => Math.min(maxSteps, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if ((recordType === "record" || recordType === "reminder") && !form.title.trim()) {
      push("Title is required");
      return;
    }
    if (recordType === "warranty" && !form.item.trim()) {
      push("Item is required");
      return;
    }

    const costNum =
      form.cost.trim() && !Number.isNaN(Number(form.cost)) ? Number(form.cost) : undefined;

    let payload: UnifiedRecordPayload;

    if (recordType === "record") {
      payload = {
        id: uid(),
        type: "record",
        title: form.title.trim(),
        date: form.date,
        category: form.category,
        vendor: form.vendor?.trim() || undefined,
        cost: costNum,
        verified: form.verified,
        note: form.note?.trim() || undefined,
        kind: form.category?.toLowerCase(),
      };
    } else if (recordType === "reminder") {
      payload = {
        id: uid(),
        type: "reminder",
        title: form.title.trim(),
        dueAt: form.dueAt,
        note: form.note?.trim() || undefined,
      };
    } else {
      payload = {
        id: uid(),
        type: "warranty",
        title: form.item.trim(),
        item: form.item.trim(),
        provider: form.provider?.trim() || undefined,
        expiresAt: form.expiresAt || undefined,
        purchasedAt: form.purchasedAt,
        note: form.note?.trim() || undefined,
      };
    }

    onCreate({ payload, files });
    onClose();
    push(`${recordType.charAt(0).toUpperCase() + recordType.slice(1)} added`);
  }

  const typeLabels: Record<RecordType, string> = {
    record: "Record",
    reminder: "Reminder",
    warranty: "Warranty",
  };

  return (
    <div className="relative z-[100]">
      <Modal open={open} onCloseAction={onClose} title="Add to Home">
        <form className="space-y-4" onSubmit={submit}>
          <div className="mb-3">
            <Stepper step={step} labels={stepLabels} />
          </div>

          {/* Step 1: Choose Type */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="mb-3 text-sm text-white/70">What would you like to add?</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TypeCard
                  selected={recordType === "record"}
                  onClick={() => setRecordType("record")}
                  icon="🔧"
                  label="Record"
                  description="Track projects, repairs, upgrades, and maintenance"
                />
                <TypeCard
                  selected={recordType === "reminder"}
                  onClick={() => setRecordType("reminder")}
                  icon="⏰"
                  label="Reminder"
                  description="Schedule future tasks"
                />
                <TypeCard
                  selected={recordType === "warranty"}
                  onClick={() => setRecordType("warranty")}
                  icon="📄"
                  label="Warranty"
                  description="Store warranty info and docs"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="button" onClick={next}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Upload */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className={labelCaps}>Upload files (optional)</div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15"
                  >
                    Browse…
                  </button>

                  <div className="text-sm text-white/70">
                    {files.length === 0
                      ? "No files selected."
                      : `${files.length} file${files.length === 1 ? "" : "s"} selected.`}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => onFiles(e.target.files)}
                    className="sr-only"
                  />
                </div>

                <p className={`mt-2 text-sm ${textMeta}`}>
                  {recordType === "record" && "Optional — add before/after photos, manuals, receipts."}
                  {recordType === "reminder" && "Optional — attach supporting documents."}
                  {recordType === "warranty" && "Optional — attach warranty docs, manuals, receipts."}
                </p>
              </div>

              {previews.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {previews.map((u, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <Image
                        src={u}
                        alt={`Preview ${i + 1}`}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-xl border border-white/20 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute -right-1.5 -top-1.5 rounded-full border border-white/25 bg-black/70 px-2 py-0.5 text-xs text-white/90 hover:bg-black/85"
                        aria-label="Remove file"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <GhostButton type="button" onClick={back}>
                  Back
                </GhostButton>
                <Button type="button" onClick={next}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4">
              {recordType === "record" && (
                <>
                  <label className="block">
                    <span className={labelCaps}>Title</span>
                    <div className={fieldShell}>
                      <input
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                        placeholder="e.g., HVAC Tune-up"
                        className={fieldInner}
                      />
                    </div>
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelCaps}>Date</span>
                      <div className={fieldShell}>
                        <input
                          type="date"
                          value={form.date}
                          onChange={(e) => set("date", e.target.value)}
                          className={fieldInner}
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className={labelCaps}>Category</span>
                      <div className={`${fieldShell} relative`}>
                        <select
                          value={form.category}
                          onChange={(e) => set("category", e.target.value)}
                          className={selectInner}
                        >
                          <option className="bg-gray-900">Maintenance</option>
                          <option className="bg-gray-900">Repair</option>
                          <option className="bg-gray-900">Upgrade</option>
                          <option className="bg-gray-900">Inspection</option>
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                          ▾
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelCaps}>Vendor</span>
                      <div className={fieldShell}>
                        <input
                          value={form.vendor}
                          onChange={(e) => set("vendor", e.target.value)}
                          placeholder="e.g., ChillRight Heating"
                          className={fieldInner}
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className={labelCaps}>Cost</span>
                      <div className={fieldShell}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.cost}
                          onChange={(e) => set("cost", e.target.value)}
                          placeholder="0.00"
                          className={fieldInner}
                        />
                      </div>
                    </label>
                  </div>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.verified}
                      onChange={(e) => set("verified", e.target.checked)}
                      className="h-4 w-4 rounded border-white/30 bg-black/30"
                    />
                    <span className="text-sm text-white/85">Mark as verified by vendor</span>
                  </label>

                  <label className="block">
                    <span className={labelCaps}>
                      Notes <span className="text-white/35">(optional)</span>
                    </span>
                    <div className={fieldShell}>
                      <textarea
                        rows={3}
                        value={form.note}
                        onChange={(e) => set("note", e.target.value)}
                        placeholder="Optional details…"
                        className={textareaInner}
                      />
                    </div>
                  </label>
                </>
              )}

              {recordType === "reminder" && (
                <>
                  <label className="block">
                    <span className={labelCaps}>Title</span>
                    <div className={fieldShell}>
                      <input
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                        placeholder="e.g., Replace HVAC filter"
                        className={fieldInner}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className={labelCaps}>Due Date</span>
                    <div className={fieldShell}>
                      <input
                        type="date"
                        value={form.dueAt}
                        onChange={(e) => set("dueAt", e.target.value)}
                        className={fieldInner}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className={labelCaps}>
                      Notes <span className="text-white/35">(optional)</span>
                    </span>
                    <div className={fieldShell}>
                      <textarea
                        rows={3}
                        value={form.note}
                        onChange={(e) => set("note", e.target.value)}
                        placeholder="Additional details…"
                        className={textareaInner}
                      />
                    </div>
                  </label>
                </>
              )}

              {recordType === "warranty" && (
                <>
                  <label className="block">
                    <span className={labelCaps}>Item</span>
                    <div className={fieldShell}>
                      <input
                        value={form.item}
                        onChange={(e) => set("item", e.target.value)}
                        placeholder="e.g., Water Heater"
                        className={fieldInner}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className={labelCaps}>
                      Provider <span className="text-white/35">(optional)</span>
                    </span>
                    <div className={fieldShell}>
                      <input
                        value={form.provider}
                        onChange={(e) => set("provider", e.target.value)}
                        placeholder="e.g., AO Smith"
                        className={fieldInner}
                      />
                    </div>
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelCaps}>Purchase Date</span>
                      <div className={fieldShell}>
                        <input
                          type="date"
                          value={form.purchasedAt}
                          onChange={(e) => set("purchasedAt", e.target.value)}
                          className={fieldInner}
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className={labelCaps}>
                        Expires <span className="text-white/35">(optional)</span>
                      </span>
                      <div className={fieldShell}>
                        <input
                          type="date"
                          value={form.expiresAt}
                          onChange={(e) => set("expiresAt", e.target.value)}
                          className={fieldInner}
                        />
                      </div>
                    </label>
                  </div>

                  <label className="block">
                    <span className={labelCaps}>
                      Notes <span className="text-white/35">(optional)</span>
                    </span>
                    <div className={fieldShell}>
                      <textarea
                        rows={3}
                        value={form.note}
                        onChange={(e) => set("note", e.target.value)}
                        placeholder="Coverage details, serial numbers, etc."
                        className={textareaInner}
                      />
                    </div>
                  </label>
                </>
              )}

              <div className="flex justify-between pt-2">
                <GhostButton type="button" onClick={back}>
                  Back
                </GhostButton>
                <Button type="button" onClick={next}>
                  Review
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === maxSteps && (
            <div className="space-y-4">
              <div className="space-y-3 rounded-2xl border border-white/20 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl">
                    {recordType === "record" ? "🔧" : recordType === "reminder" ? "⏰" : "📄"}
                  </span>
                  <span className="text-sm uppercase tracking-wide text-white/60">
                    {typeLabels[recordType]}
                  </span>
                </div>

                {recordType === "record" && (
                  <>
                    <ReviewField label="Title" value={form.title} />
                    <div className="grid grid-cols-2 gap-4">
                      <ReviewField label="Date" value={form.date} />
                      <ReviewField label="Category" value={form.category} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <ReviewField label="Vendor" value={form.vendor} />
                      <ReviewField
                        label="Cost"
                        value={form.cost.trim() ? `$${Number(form.cost).toFixed(2)}` : ""}
                      />
                    </div>
                    {form.verified && <div className="text-sm text-green-400">✓ Verified by vendor</div>}
                    {form.note && <ReviewField label="Notes" value={form.note} />}
                  </>
                )}

                {recordType === "reminder" && (
                  <>
                    <ReviewField label="Title" value={form.title} />
                    <ReviewField label="Due Date" value={form.dueAt} />
                    {form.note && <ReviewField label="Notes" value={form.note} />}
                  </>
                )}

                {recordType === "warranty" && (
                  <>
                    <ReviewField label="Item" value={form.item} />
                    {form.provider && <ReviewField label="Provider" value={form.provider} />}
                    <div className="grid grid-cols-2 gap-4">
                      <ReviewField label="Purchased" value={form.purchasedAt} />
                      {form.expiresAt && <ReviewField label="Expires" value={form.expiresAt} />}
                    </div>
                    {form.note && <ReviewField label="Notes" value={form.note} />}
                  </>
                )}

                {previews.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-wide text-white/60">
                      Attachments
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                      {previews.map((u, i) => (
                        <Image
                          key={i}
                          src={u}
                          alt={`Attachment ${i + 1}`}
                          width={60}
                          height={60}
                          className="h-16 w-16 rounded-xl border border-white/20 object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <GhostButton type="button" onClick={back}>
                  Back
                </GhostButton>
                <Button type="submit">Save {typeLabels[recordType]}</Button>
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

function TypeCard({
  selected,
  onClick,
  icon,
  label,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border p-4 text-left transition-all",
        "focus:outline-none",
        selected
          ? "border-[#33C17D] bg-white/10 shadow-[0_0_0_1px_rgba(51,193,125,0.35)]"
          : "border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25",
      ].join(" ")}
    >
      <div className="mb-2 text-3xl">{icon}</div>
      <div className="mb-1 text-sm font-medium text-white">{label}</div>
      <div className="text-xs text-white/60">{description}</div>
    </button>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wide text-white/60">{label}</div>
      <div className="text-white">
        {value ? value : <span className="text-white/40">Not specified</span>}
      </div>
    </div>
  );
}

function Stepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {labels.map((label, i) => {
        const active = step === i + 1;
        const completed = step > i + 1;
        return (
          <div
            key={label}
            className={[
              "rounded-full border px-2 py-0.5 text-xs",
              active
                ? "border-white/30 bg-white/15 font-medium text-white"
                : completed
                ? "border-[#33C17D]/40 bg-[#33C17D]/10 text-[#33C17D]"
                : "border-white/15 bg-white/10 text-white/70",
            ].join(" ")}
          >
            {i + 1}. {label}
          </div>
        );
      })}
    </div>
  );
}