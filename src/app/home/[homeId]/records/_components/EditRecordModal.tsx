"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea, fieldLabel } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type RecordData = {
  id: string;
  title: string;
  date: Date | null;
  kind: string | null;
  vendor: string | null;
  cost: number | null;
  note: string | null;
};

type Props = {
  open: boolean;
  onCloseAction: () => void;
  record: RecordData;
  homeId: string;
};

export function EditRecordModal({ open, onCloseAction, record, homeId }: Props) {
  const router = useRouter();
  const { push } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: record.title,
    date: record.date ? new Date(record.date).toISOString().slice(0, 10) : "",
    category: record.kind || "Maintenance",
    vendor: record.vendor || "",
    cost: record.cost || 0,
    note: record.note || "",
  });

  // Reset form when record changes or modal opens
  useEffect(() => {
    if (!open) return;
    setForm({
      title: record.title,
      date: record.date
        ? new Date(record.date).toISOString().slice(0, 10)
        : "",
      category: record.kind || "Maintenance",
      vendor: record.vendor || "",
      cost: record.cost || 0,
      note: record.note || "",
    });
  }, [open, record.id, record.title, record.date, record.kind, record.vendor, record.cost, record.note]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      push("Title is required");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/home/${homeId}/records/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          date: form.date || undefined,
          kind: form.category?.toLowerCase(),
          vendor: form.vendor || null,
          cost: form.cost || null,
          note: form.note || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update record");
      }

      push("Record updated successfully");
      onCloseAction();
      router.refresh();
    } catch (error) {
      console.error("Failed to update record:", error);
      push(
        error instanceof Error ? error.message : "Failed to update record"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onCloseAction={onCloseAction} title="Edit Record">
      <div className="max-h-[calc(100vh-5rem)] overflow-y-auto px-1 pb-2 sm:px-0">
        <form onSubmit={handleSubmit} className="space-y-4 pt-1 sm:pt-0">
          <label className="block">
            <span className={fieldLabel}>Title</span>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g., HVAC Tune-up"
              required
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <label className="block">
            <span className={fieldLabel}>Notes</span>
            <Textarea
              rows={3}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Optional details…"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <GhostButton type="button" onClick={onCloseAction} disabled={saving}>
              Cancel
            </GhostButton>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}