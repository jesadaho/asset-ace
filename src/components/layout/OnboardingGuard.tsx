"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLiff } from "@/providers/LiffProvider";
import {
  checkOnboardingStatus,
  getRoleDashboardPath,
} from "@/lib/api/onboarding";

const ONBOARDING_PATH = "/onboarding";

const ALLOWED_PATHS = [
  "/",
  ONBOARDING_PATH,
  "/owners",
  "/agents",
  "/tenants",
];

function getIntendedPathFromQuery(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const path = params.get("path") ?? params.get("redirect");
  if (!path || !path.startsWith("/")) return null;
  const normalized = path.split("?")[0];
  return ALLOWED_PATHS.includes(normalized) ? normalized : null;
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, isLoggedIn, liffId } = useLiff();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isReady || !liffId || isLoggedIn !== true) {
      setChecked(true);
      return;
    }

    let cancelled = false;

    async function run() {
      const status = await checkOnboardingStatus();
      if (cancelled) return;

      const queryPath = getIntendedPathFromQuery();
      let targetPath: string | null = null;

      if (!status.onboarded) {
        targetPath = ONBOARDING_PATH;
      } else if (pathname === ONBOARDING_PATH && status.role) {
        targetPath = getRoleDashboardPath(status.role);
      } else if (queryPath && queryPath !== pathname) {
        if (queryPath === ONBOARDING_PATH && status.onboarded && status.role) {
          targetPath = getRoleDashboardPath(status.role);
        } else {
          targetPath = queryPath;
        }
      }

      if (targetPath && pathname !== targetPath) {
        router.replace(targetPath);
      } else if (queryPath && typeof window !== "undefined" && window.location.search) {
        router.replace(pathname);
      }
      setChecked(true);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [isReady, liffId, isLoggedIn, pathname, router]);

  if (!checked && liffId && isLoggedIn) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0F172A]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
