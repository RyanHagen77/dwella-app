"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, fieldLabel } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";
import { glassTight, textMeta } from "@/lib/glass";

export type VendorDirectoryItem = {
  id: string;
  name: string;
  type: string; // e.g., "HVAC", "Plumber"
  rating: number; // 0-5
  verified: boolean;
  phone?: string;
  website?: string;
};

type Props = {
  open: boolean;
  onCloseAction: () => void;
  onAddAction: (v: VendorDirectoryItem) => void; // parent will convert to Vendor type
};

// Simple local data (replace with API later if needed)
const DIRECTORY: VendorDirectoryItem[] = [
  { id: "v1", name: "ChillRight Heating & Air", type: "HVAC", rating: 4.7, verified: true, phone: "(555) 203-8822", website: "#" },
  { id: "v2", name: "Rapid Rooter", type: "Plumber", rating: 4.5, verified: false, phone: "(555) 555-1212", website: "#" },
  { id: "v3", name: "Peak Roofing Co.", type: "Roofer", rating: 4.8, verified: true, phone: "(555) 777-1020", website: "#" },
  { id: "v4", name: "Spark Electric", type: "Electrician", rating: 4.6, verified: true, phone: "(555) 333-4411", website: "#" },
];

export function FindVendorsModal({
  open,
  onCloseAction: onClose,
  onAddAction: onAdd,
}: Props) {
  const [q, setQ] = React.useState("");

  const results = React.useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return DIRECTORY;
    return DIRECTORY.filter(
      (v) =>
        v.name.toLowerCase().includes(term) ||
        v.type.toLowerCase().includes(term)
    );
  }, [q]);

  // Optional: reset search when opening
  React.useEffect(() => {
    if (!open) return;
    setQ("");
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Find Vendors">
      <div className="space-y-3">
        <label className="block">
          <span className={fieldLabel}>Search</span>
          <Input
            placeholder="e.g., HVAC, Plumber, Roof"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>

        <div className={glassTight}>
          <p className={`text-sm ${textMeta}`}>
            Add trusted vendors to your Homefax. You can request service from a vendor once added.
          </p>
        </div>

        <ul className="space-y-2">
          {results.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-white">{v.name}</div>
                <div className={`text-sm ${textMeta}`}>
                  {v.type} • {v.rating.toFixed(1)} ★{" "}
                  {v.verified ? "• Verified" : "• Unverified"}
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                <GhostButton
                  type="button"
                  onClick={() => onAdd(v)}
                >
                  Add
                </GhostButton>

                {v.website && (
                  <a
                    className="text-sm text-white/80 underline hover:text-white"
                    href={v.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Site
                  </a>
                )}
              </div>
            </li>
          ))}

          {results.length === 0 && (
            <li className={`text-sm ${textMeta}`}>No matches.</li>
          )}
        </ul>

        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}