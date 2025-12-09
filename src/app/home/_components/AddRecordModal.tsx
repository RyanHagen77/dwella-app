"use client";

import * as React from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea, fieldLabel } from "@/components/ui";
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

export function AddRecordModal({ open, onCloseAction, onCreateAction, defaultType = "record" }: Props) {
  const { push } = useToast();
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [recordType, setRecordType] = React.useState<RecordType>(defaultType);
  const [step, setStep] = React.useState(1);
  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);

  // Form state for all types
  const [form, setForm] = React.useState({
    // Record fields
    title: "",
    date: today,
    category: "Maintenance",
    vendor: "",
    cost: 0,
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

  // Reset when modal opens
  React.useEffect(() => {
    if (!open) return;
    setRecordType(defaultType);
    setStep(1);
    setFiles([]);
    previews.forEach(url => URL.revokeObjectURL(url));
    setPreviews([]);
    setForm({
      title: "",
      date: today,
      category: "Maintenance",
      vendor: "",
      cost: 0,
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

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const newPreviews = arr.map(f => URL.createObjectURL(f));
    setPreviews(newPreviews);
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]);
    setFiles(f => f.filter((_, i) => i !== index));
    setPreviews(p => p.filter((_, i) => i !== index));
  }

  const next = () => setStep((s) => Math.min(maxSteps, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  function submit(e: React.FormEvent) {
    e.preventDefault();

    // Validate based on type
    if (recordType === "record" && !form.title) {
      push("Title is required");
      return;
    }
    if (recordType === "reminder" && !form.title) {
      push("Title is required");
      return;
    }
    if (recordType === "warranty" && !form.item) {
      push("Item is required");
      return;
    }

    let payload: UnifiedRecordPayload;

    if (recordType === "record") {
      payload = {
        id: uid(),
        type: "record",
        title: form.title,
        date: form.date,
        category: form.category,
        vendor: form.vendor,
        cost: form.cost,
        verified: form.verified,
        note: form.note,
        kind: form.category?.toLowerCase(),
      };
    } else if (recordType === "reminder") {
      payload = {
        id: uid(),
        type: "reminder",
        title: form.title,
        dueAt: form.dueAt,
        note: form.note,
      };
    } else {
      // warranty
      payload = {
        id: uid(),
        type: "warranty",
        title: form.item,
        item: form.item,
        provider: form.provider,
        expiresAt: form.expiresAt,
        purchasedAt: form.purchasedAt,
        note: form.note,
      };
    }

    onCreateAction({ payload, files });
    onCloseAction();
    push(`${recordType.charAt(0).toUpperCase() + recordType.slice(1)} added`);
  }

  const typeLabels = {
    record: "Record",
    reminder: "Reminder",
    warranty: "Warranty",
  };

  const stepLabels = ["Type", "Upload", "Details", "Review"];
  const maxSteps = stepLabels.length;

  return (
    <div className="relative z-[100]">
      <Modal open={open} onCloseAction={onCloseAction} title="Add to Home">
        <form className="space-y-4" onSubmit={submit}>
        <div className="mb-3">
          <Stepper step={step} labels={stepLabels} />
        </div>

        {/* Step 1: Choose Type */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="text-sm text-white/70 mb-3">What would you like to add?</div>
            <div className="grid grid-cols-3 gap-3">
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
              <Button type="button" onClick={next}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 2: Upload */}
        {step === 2 && (
          <div className="space-y-3">
            <label className="block">
              <span className={fieldLabel}>Upload files (optional)</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => onFiles(e.target.files)}
                className="mt-1 block w-full text-white/85 file:mr-3 file:rounded-md file:border file:border-white/30 file:bg-white/10 file:px-3 file:py-1.5 file:text-white hover:file:bg-white/15"
              />
            </label>

            {previews.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {previews.map((u, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <Image
                      src={u}
                      alt={`Preview ${i + 1}`}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded border border-white/20 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-xs text-white hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className={`text-sm ${textMeta}`}>
                {recordType === "record" && "Photos of document-completed-service-submissions-records-records, receipts, etc."}
                {recordType === "reminder" && "Supporting documents"}
                {recordType === "warranty" && "Warranty documents, manuals, receipts"}
              </span>
              <div className="flex gap-2">
                <GhostButton type="button" onClick={back}>Back</GhostButton>
                <Button type="button" onClick={next}>Next</Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <div className="space-y-3">
            {recordType === "record" && (
              <>
                <label className="block">
                  <span className={fieldLabel}>Title</span>
                  <Input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g., HVAC Tune-up"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={fieldLabel}>Date</span>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => set("date", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Category</span>
                    <Select
                      value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                    >
                      <option>Maintenance</option>
                      <option>Repair</option>
                      <option>Upgrade</option>
                      <option>Inspection</option>
                    </Select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={fieldLabel}>Vendor</span>
                    <Input
                      value={form.vendor}
                      onChange={(e) => set("vendor", e.target.value)}
                      placeholder="e.g., ChillRight Heating"
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Cost</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.cost}
                      onChange={(e) => set("cost", Number(e.target.value))}
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.verified}
                    onChange={(e) => set("verified", e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-black/30"
                  />
                  <span className="text-sm text-white/85">Mark as verified by vendor</span>
                </label>

                <label className="block">
                  <span className={fieldLabel}>Notes (optional)</span>
                  <Textarea
                    rows={3}
                    value={form.note}
                    onChange={(e) => set("note", e.target.value)}
                    placeholder="Optional details…"
                  />
                </label>
              </>
            )}

            {recordType === "reminder" && (
              <>
                <label className="block">
                  <span className={fieldLabel}>Title</span>
                  <Input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g., Replace HVAC filter"
                  />
                </label>

                <label className="block">
                  <span className={fieldLabel}>Due Date</span>
                  <Input
                    type="date"
                    value={form.dueAt}
                    onChange={(e) => set("dueAt", e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className={fieldLabel}>Notes (optional)</span>
                  <Textarea
                    rows={3}
                    value={form.note}
                    onChange={(e) => set("note", e.target.value)}
                    placeholder="Additional details…"
                  />
                </label>
              </>
            )}

            {recordType === "warranty" && (
              <>
                <label className="block">
                  <span className={fieldLabel}>Item</span>
                  <Input
                    value={form.item}
                    onChange={(e) => set("item", e.target.value)}
                    placeholder="e.g., Water Heater"
                  />
                </label>

                <label className="block">
                  <span className={fieldLabel}>Provider (optional)</span>
                  <Input
                    value={form.provider}
                    onChange={(e) => set("provider", e.target.value)}
                    placeholder="e.g., AO Smith"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={fieldLabel}>Purchase Date</span>
                    <Input
                      type="date"
                      value={form.purchasedAt}
                      onChange={(e) => set("purchasedAt", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Expires (optional)</span>
                    <Input
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => set("expiresAt", e.target.value)}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className={fieldLabel}>Notes (optional)</span>
                  <Textarea
                    rows={3}
                    value={form.note}
                    onChange={(e) => set("note", e.target.value)}
                    placeholder="Coverage details, serial numbers, etc."
                  />
                </label>
              </>
            )}

            <div className="flex justify-between pt-2">
              <GhostButton type="button" onClick={back}>Back</GhostButton>
              <Button type="button" onClick={next}>Review</Button>
            </div>
          </div>
        )}

        {/* Final Step: Review */}
        {step === maxSteps && (
          <div className="space-y-4">
            <div className="rounded-lg border border-white/20 bg-white/5 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">
                  {recordType === "record" ? "🔧" : recordType === "reminder" ? "⏰" : "📄"}
                </span>
                <span className="text-sm text-white/60 uppercase tracking-wide">
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
                    <ReviewField label="Cost" value={`$${form.cost?.toFixed(2) || "0.00"}`} />
                  </div>
                  {form.verified && (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified by vendor
                    </div>
                  )}
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
                  <div className="text-xs text-white/60 uppercase tracking-wide mb-2">Attachments</div>
                  <div className="flex gap-2 overflow-x-auto">
                    {previews.map((u, i) => (
                      <Image
                        key={i}
                        src={u}
                        alt={`Attachment ${i + 1}`}
                        width={60}
                        height={60}
                        className="h-16 w-16 rounded border border-white/20 object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <GhostButton type="button" onClick={back}>Back</GhostButton>
              <Button type="submit">
                Save {typeLabels[recordType]}
              </Button>
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
  description
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
      className={`p-4 rounded-lg border-2 transition-all text-left ${
        selected
          ? "border-white/50 bg-white/15 scale-105"
          : "border-white/20 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-medium text-white text-sm mb-1">{label}</div>
      <div className="text-xs text-white/60">{description}</div>
    </button>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-white/60 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-white">{value || <span className="text-white/40">Not specified</span>}</div>
    </div>
  );
}

function Stepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {labels.map((label, i) => {
        const active = step === i + 1;
        const completed = step > i + 1;
        return (
          <div
            key={label}
            className={`rounded-full border px-2 py-0.5 text-xs ${
              active 
                ? "border-white/30 bg-white/20 text-white font-medium" 
                : completed
                ? "border-green-400/30 bg-green-400/10 text-green-400"
                : "border-white/20 bg-white/10 text-white/70"
            }`}
          >
            {i + 1}. {label}
          </div>
        );
      })}
    </div>
  );
}

export default AddRecordModal;