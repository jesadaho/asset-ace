"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLiff } from "@/providers/LiffProvider";
import {
  checkOnboardingStatus,
  getRoleDashboardPath,
} from "@/lib/api/onboarding";

const ONBOARDING_PATH = "/onboarding";

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

      if (pathname === ONBOARDING_PATH) {
        if (status.onboarded && status.role) {
          router.replace(getRoleDashboardPath(status.role));
        }
      } else {
        if (!status.onboarded) {
          router.replace(ONBOARDING_PATH);
        }
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
