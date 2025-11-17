"use client";
import * as React from "react";

type ToastItem = { id: string; message: string };
const Ctx = React.createContext<{
  toasts: ToastItem[];
  push: (message: string) => void;
}>({ toasts: [], push: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  function push(message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }

  return (
    <Ctx.Provider value={{ toasts, push }}>
      {children}
      {mounted && (
        <div
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2147483647,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'none'
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                backgroundColor: 'rgba(31, 41, 55, 0.95)',
                color: '#ef4444',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                minWidth: '300px',
                maxWidth: '500px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                pointerEvents: 'auto',
                fontSize: '14px',
                lineHeight: '1.5',
                textAlign: 'center',
                backdropFilter: 'blur(8px)'
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useToast(){ return React.useContext(Ctx); }