/**
 * ADMIN SETTINGS PAGE
 *
 * Application configuration and feature flags.
 * Currently displays read-only settings.
 *
 * Location: app/admin/settings/page.tsx
 */

import { glass, heading, textMeta } from "@/lib/glass";
import { Settings, Mail, Bell, Shield, Flag, FileText } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className={"text-2xl font-bold " + heading}>Settings</h1>
        <p className={"mt-1 " + textMeta}>Application configuration</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsCard
          icon={Mail}
          title="Email Configuration"
          items={[
            { label: "Provider", value: "Resend" },
            { label: "From Address", value: "noreply@mydwellaapp.com" },
            { label: "Transfer Expiry", value: "7 days" },
          ]}
        />

        <SettingsCard
          icon={Bell}
          title="Notifications"
          items={[
            { label: "Email on Pro Application", value: "Enabled", toggle: true },
            { label: "Email on Transfer Accepted", value: "Enabled", toggle: true },
            { label: "Weekly Digest", value: "Disabled", toggle: true },
          ]}
        />

        <SettingsCard
          icon={Shield}
          title="Security"
          items={[
            { label: "Two-Factor Auth", value: "Optional", toggle: true },
            { label: "Session Timeout", value: "30 days" },
            { label: "Max Login Attempts", value: "5" },
          ]}
        />

        <SettingsCard
          icon={Flag}
          title="Feature Flags"
          items={[
            { label: "Pro Applications", value: "Enabled", toggle: true },
            { label: "Home Transfers", value: "Enabled", toggle: true },
            { label: "Messaging", value: "Enabled", toggle: true },
            { label: "Job Requests", value: "Enabled", toggle: true },
          ]}
        />
      </div>

      <section className={glass}>
        <div className="mb-4 flex items-center gap-3">
          <FileText size={20} className="text-white/70" />
          <h2 className={"text-lg font-semibold " + heading}>Email Templates</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TemplateItem name="Welcome Email" />
          <TemplateItem name="Transfer Invitation" />
          <TemplateItem name="Transfer Accepted" />
          <TemplateItem name="Pro Approved" />
          <TemplateItem name="Pro Rejected" />
          <TemplateItem name="New Message" />
        </div>
      </section>

      <section className={glass}>
        <h2 className={"text-lg font-semibold mb-4 text-red-400"}>Danger Zone</h2>
        <div className="space-y-3">
          <DangerItem
            title="Clear All Sessions"
            description="Log out all users from their current sessions"
          />
          <DangerItem
            title="Reset All Caches"
            description="Clear all cached data and regenerate"
          />
        </div>
      </section>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items: Array<{ label: string; value: string; toggle?: boolean }>;
}) {
  return (
    <div className={glass}>
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-white/10 p-2">
          <Icon size={18} className="text-white/70" />
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className={textMeta}>{item.label}</span>
            {item.toggle ? (
              <span
                className={
                  "rounded-full px-2 py-0.5 text-xs " +
                  (item.value === "Enabled" || item.value === "Optional"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-white/10 text-white/60")
                }
              >
                {item.value}
              </span>
            ) : (
              <span className="text-white">{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateItem({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
      <span className="text-sm text-white">{name}</span>
      <button className="text-xs text-blue-400 hover:text-blue-300">Preview</button>
    </div>
  );
}

function DangerItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-4">
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className={"text-sm " + textMeta}>{description}</p>
      </div>
      <button className="rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/30">
        Execute
      </button>
    </div>
  );
}