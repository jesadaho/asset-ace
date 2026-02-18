"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/owners", label: "Owners", icon: Building2 },
  { href: "/tenants", label: "Home", icon: Home },
  { href: "/agents", label: "Agents", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#0F172A]/10 bg-white safe-area-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 tap-target min-h-[44px] transition-colors",
                isActive
                  ? "text-[#10B981]"
                  : "text-[#0F172A]/50 hover:text-[#0F172A]/70"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-6 w-6" aria-hidden />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
