"use client";
import * as React from "react";

type ToastType = "success" | "error";
type ToastItem = { id: string; message: string; type: ToastType };

const Ctx = React.createContext<{
  toasts: ToastItem[];
  push: (message: string, type?: ToastType) => void;
}>({ toasts: [], push: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  function push(message: string, type: ToastType = "error") {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }

  return (
    <Ctx.Provider value={{ toasts, push }}>
      {children}
      {mounted && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-20 left-1/2 z-[2147483647] flex -translate-x-1/2 flex-col gap-2"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto min-w-[300px] max-w-[500px] rounded-lg border px-4 py-3 text-center text-sm leading-relaxed shadow-xl backdrop-blur-lg ${
                t.type === "success"
                  ? "border-emerald-400/30 bg-gray-800/95 text-emerald-400"
                  : "border-red-400/30 bg-gray-800/95 text-red-400"
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useToast() {
  return React.useContext(Ctx);
}