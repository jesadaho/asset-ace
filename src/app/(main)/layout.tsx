import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <main className="flex-1 pb-20 max-w-lg mx-auto w-full px-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
