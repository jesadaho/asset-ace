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

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#0F172A] text-white">
      <div className="max-w-lg mx-auto px-4 py-12 safe-area-top">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Asset Ace
          </h1>
          <p className="text-white/70 text-lg">
            Professional multi-tenant property management
          </p>
        </header>

        <div className="space-y-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Link key={role.href} href={role.href}>
                <Card variant="outline" className="hover:border-[#10B981]/30 transition-colors cursor-pointer">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/20 text-[#10B981]">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white mb-0.5">
                        {role.label}
                      </CardTitle>
                      <p className="text-sm text-white/70">{role.description}</p>
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
