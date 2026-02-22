"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastContextValue = {
  show: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const show = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div
          className="fixed bottom-24 left-4 right-4 z-[100] max-w-md mx-auto px-4 py-3 rounded-xl bg-slate-800 text-white text-sm shadow-lg"
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ?? { show: () => {} };
}
