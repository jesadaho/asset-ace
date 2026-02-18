"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, User, Home } from "lucide-react";
import { Card, CardTitle, CardContent } from "@/components/ui/Card";

const roles = [
  {
    href: "/owners",
    label: "Asset Owners",
    description: "Manage your property portfolio",
    icon: Building2,
  },
  {
    href: "/agents",
    label: "Agents",
    description: "Coordinate listings and viewings",
    icon: User,
  },
  {
    href: "/tenants",
    label: "Tenants",
    description: "View lease and pay rent",
    icon: Home,
  },
];

function SplashView() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 bg-[#F8FAFC] safe-area-top safe-area-bottom">
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F172A] text-[#10B981]">
          <Building2 className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
          Asset Ace
        </h1>
        <div
          className="h-6 w-6 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin"
          aria-hidden
        />
      </div>
    </div>
  );
}

function RoleSelectionView() {
  return (
    <div className="min-h-dvh bg-[#F8FAFC] safe-area-top safe-area-bottom">
      <div className="max-w-lg mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mb-2">
            Asset Ace
          </h1>
          <p className="text-[#0F172A]/70 text-base sm:text-lg">
            Professional multi-tenant property management
          </p>
        </header>

        <div className="space-y-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Link key={role.href} href={role.href}>
                <Card
                  variant="light"
                  className="hover:border-[#10B981]/40 transition-colors cursor-pointer tap-target"
                >
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex h-12 w-12 min-w-[48px] items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981]">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-[#0F172A] mb-0.5">
                        {role.label}
                      </CardTitle>
                      <p className="text-sm text-[#0F172A]/70">
                        {role.description}
                      </p>
                    </div>
                    <span className="inline-flex h-9 items-center justify-center rounded-lg bg-[#10B981] px-4 text-sm font-medium text-white shrink-0">
                      Enter
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-dvh">
      <div
        className={`transition-opacity duration-500 ${
          showSplash ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0"
        }`}
      >
        <SplashView />
      </div>
      <div
        className={`transition-opacity duration-500 ${
          showSplash ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <RoleSelectionView />
      </div>
    </div>
  );
}
