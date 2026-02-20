"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, Building2, LogIn, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiff } from "@/providers/LiffProvider";
import { Button } from "@/components/ui/Button";

const SIDEBAR_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/richmenu", label: "Rich Menu", icon: Menu },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { isReady, isLoggedIn, login } = useLiff();

  useEffect(() => {
    if (!isLoggedIn) {
      setIsAdmin(null);
      return;
    }
    let cancelled = false;
    async function checkAdmin() {
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (!token) {
          if (!cancelled) setIsAdmin(false);
          return;
        }
        const res = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        const data = (await res.json()) as { isAdmin?: boolean };
        setIsAdmin(!!data.isAdmin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    }
    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (isLoggedIn !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center max-w-md">
          <LogIn className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h1 className="text-xl font-semibold text-slate-800 mb-2">
            Admin area
          </h1>
          <p className="text-slate-600 mb-6">
            Sign in with LINE to access the admin dashboard.
          </p>
          <Button
            variant="primary"
            size="lg"
            leftIcon={<LogIn className="h-5 w-5" />}
            onClick={login}
          >
            Login with LINE
          </Button>
        </div>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center max-w-md">
          <Settings className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h1 className="text-xl font-semibold text-slate-800 mb-2">
            Admin only
          </h1>
          <p className="text-slate-600">
            This area is restricted to Super Admins. Ensure your LINE user ID is
            listed in <code className="text-sm bg-slate-100 px-1 rounded">ADMIN_LINE_USER_IDS</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside
        className={cn(
          "flex flex-col border-r border-slate-200 bg-white text-slate-800 transition-[width] duration-200",
          sidebarOpen ? "w-56" : "w-16"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3">
          {sidebarOpen && (
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Asset Ace
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {SIDEBAR_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
