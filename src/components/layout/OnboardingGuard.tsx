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

const DEBUG_LOG = (data: Record<string, unknown>) => {
  try {
    // #region agent log
    fetch("http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d6e810" },
      body: JSON.stringify({
        sessionId: "d6e810",
        location: "OnboardingGuard.tsx",
        message: "OnboardingGuard",
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  } catch {}
};

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, isLoggedIn, liffId } = useLiff();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const runId = "H1-H5";
    DEBUG_LOG({
      hypothesisId: "H1,H2,H5",
      runId,
      phase: "effect_entry",
      isReady,
      isLoggedIn,
      hasLiffId: !!liffId,
      pathname,
      windowHref: typeof window !== "undefined" ? window.location.href : "ssr",
      windowSearch: typeof window !== "undefined" ? window.location.search : "ssr",
      windowPathname: typeof window !== "undefined" ? window.location.pathname : "ssr",
    });

    if (!isReady || !liffId || isLoggedIn !== true) {
      DEBUG_LOG({
        hypothesisId: "H2",
        runId,
        phase: "early_exit_not_logged_in",
        reason: !isReady ? "not_ready" : !liffId ? "no_liff" : "not_logged_in",
      });
      setChecked(true);
      return;
    }

    let cancelled = false;

    async function run() {
      const status = await checkOnboardingStatus();
      if (cancelled) return;

      const queryPath = getIntendedPathFromQuery();
      const rawParams = typeof window !== "undefined"
        ? Object.fromEntries(new URLSearchParams(window.location.search))
        : {};
      DEBUG_LOG({
        hypothesisId: "H3,H4",
        runId,
        phase: "after_check",
        pathname,
        windowSearch: typeof window !== "undefined" ? window.location.search : "ssr",
        rawParams,
        queryPath,
        status,
      });

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

      DEBUG_LOG({
        hypothesisId: "H4",
        runId,
        phase: "redirect_decision",
        targetPath,
        willRedirect: !!(targetPath && pathname !== targetPath),
      });

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
