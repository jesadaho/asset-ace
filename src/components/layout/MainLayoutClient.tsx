"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLiff } from "@/providers/LiffProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";

const LAYOUT_HEADER_CLASS =
  "sticky top-0 z-40 border-b border-[#0F172A]/10 bg-white/95 backdrop-blur safe-area-top";

export function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isInClient } = useLiff();
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // #region agent log
    if (typeof window === "undefined") return;
    if (!isInClient && headerRef.current) {
      const el = headerRef.current;
      const bg = window.getComputedStyle(el).backgroundColor;
      fetch("http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d6e810" },
        body: JSON.stringify({
          sessionId: "d6e810",
          hypothesisId: "H1",
          location: "MainLayoutClient.tsx:header",
          message: "Layout header rendered",
          data: { isInClient, headerClassName: el.className, computedBg: bg },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } else {
      fetch("http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d6e810" },
        body: JSON.stringify({
          sessionId: "d6e810",
          hypothesisId: "H1",
          location: "MainLayoutClient.tsx:header",
          message: "Layout header not rendered (LIFF or loading)",
          data: { isInClient },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
  }, [isInClient]);

  return (
    <ToastProvider>
    <div className="min-h-dvh flex flex-col bg-[#F8FAFC]">
      {!isInClient && (
        <header ref={headerRef} className={LAYOUT_HEADER_CLASS}>
          <Link
            href="/"
            className="block py-3 px-4 text-lg font-semibold text-[#0F172A] max-w-lg mx-auto"
          >
            Asset Ace
          </Link>
        </header>
      )}
      <main
        className={`flex-1 max-w-lg mx-auto w-full px-0 ${
          isInClient ? "pb-4" : "pb-20"
        }`}
      >
        {children}
      </main>
      {!isInClient && <BottomNav />}
    </div>
    </ToastProvider>
  );
}
