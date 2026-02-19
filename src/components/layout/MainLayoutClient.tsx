"use client";

import Link from "next/link";
import { useLiff } from "@/providers/LiffProvider";
import { BottomNav } from "@/components/layout/BottomNav";

export function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isInClient } = useLiff();

  return (
    <div className="min-h-dvh flex flex-col bg-[#F8FAFC]">
      <header className="sticky top-0 z-40 border-b border-[#0F172A]/10 bg-white/95 backdrop-blur safe-area-top">
        <Link
          href="/"
          className="block py-3 px-4 text-lg font-semibold text-[#0F172A] max-w-lg mx-auto"
        >
          Asset Ace
        </Link>
      </header>
      <main
        className={`flex-1 max-w-lg mx-auto w-full px-0 ${
          isInClient ? "pb-4" : "pb-20"
        }`}
      >
        {children}
      </main>
      {!isInClient && <BottomNav />}
    </div>
  );
}
