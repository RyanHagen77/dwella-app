/**
 * ADMIN SYSTEM ACTIONS
 *
 * Maintenance task buttons for admin system page.
 *
 * Location: app/admin/system/_components/SystemActions.tsx
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Clock, Trash2, Mail, CheckCircle } from "lucide-react";
import { textMeta, ctaPrimary } from "@/lib/glass";

type Props = {
  expiredCount: number;
  oldPendingCount: number;
};

type TaskResult = {
  success: boolean;
  message: string;
  affected?: number;
};

export default function SystemActions({ expiredCount, oldPendingCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<TaskResult | null>(null);

  async function runTask(taskId: string) {
    setLoading(taskId);
    setResult(null);

    try {
      const res = await fetch("/api/admin/system/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskId }),
      });

      const data = await res.json();
      setResult(data);
      router.refresh();
    } catch {
      setResult({ success: false, message: "Failed to run task" });
    } finally {
      setLoading(null);
    }
  }

  const tasks = [
    {
      id: "expire-transfers",
      icon: Clock,
      title: "Expire Old Transfers",
      description: "Mark pending transfers past expiry date as expired",
      count: expiredCount,
      disabled: expiredCount === 0,
    },
    {
      id: "cleanup-cancelled",
      icon: Trash2,
      title: "Clean Up Cancelled",
      description: "Delete cancelled transfers older than 30 days",
      count: null,
      disabled: false,
    },
    {
      id: "refresh-stats",
      icon: RefreshCw,
      title: "Refresh Statistics",
      description: "Recalculate cached statistics",
      count: null,
      disabled: false,
    },
    {
      id: "send-reminders",
      icon: Mail,
      title: "Send Reminders",
      description: "Email reminders for old pending transfers",
      count: oldPendingCount,
      disabled: oldPendingCount === 0,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {tasks.map((task) => {
          const Icon = task.icon;
          const isLoading = loading === task.id;

          return (
            <div
              key={task.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/10 p-2">
                    <Icon size={18} className="text-white/70" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{task.title}</h3>
                    <p className={"text-xs " + textMeta}>{task.description}</p>
                  </div>
                </div>
                {task.count !== null && task.count > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                    {task.count}
                  </span>
                )}
              </div>

              <button
                onClick={() => runTask(task.id)}
                disabled={isLoading || task.disabled}
                className={ctaPrimary + " w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Running...
                  </>
                ) : (
                  "Run Task"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {result && (
        <div
          className={
            "rounded-lg p-4 " +
            (result.success
              ? "border border-emerald-500/30 bg-emerald-500/10"
              : "border border-red-500/30 bg-red-500/10")
          }
        >
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle size={18} className="text-emerald-400" />
            ) : (
              <Clock size={18} className="text-red-400" />
            )}
            <span className={result.success ? "text-emerald-300" : "text-red-300"}>
              {result.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}