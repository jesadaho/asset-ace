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

  let path = params.get("path") ?? params.get("redirect");
  if (!path) {
    const liffState = params.get("liff.state");
    if (liffState) {
      try {
        const decoded = decodeURIComponent(liffState);
        const stateParams = new URLSearchParams(
          decoded.startsWith("?") ? decoded.slice(1) : decoded
        );
        path = stateParams.get("path") ?? stateParams.get("redirect") ?? null;
      } catch {
        path = null;
      }
    }
  }

  if (!path || !path.startsWith("/")) return null;
  const normalized = path.split("?")[0];
  return ALLOWED_PATHS.includes(normalized) ? normalized : null;
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, isLoggedIn, profile, liffId, error } = useLiff();
  const [checked, setChecked] = useState(false);

  const canRedirect = isReady && (!liffId || isLoggedIn === false || profile !== null || error !== null);

  // Redirect based on liff.state/path/redirect only after LIFF state is resolved
  useEffect(() => {
    if (!canRedirect) return;
    const queryPath = getIntendedPathFromQuery();
    if (queryPath && pathname !== queryPath) {
      router.replace(queryPath);
    }
  }, [canRedirect, pathname, router]);

  useEffect(() => {
    if (!canRedirect) {
      setChecked(true);
      return;
    }
    if (isLoggedIn !== true) {
      setChecked(true);
      return;
    }

    let cancelled = false;

    async function run() {
      if (pathname.startsWith("/admin")) {
        setChecked(true);
        return;
      }

      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (token) {
          const meRes = await fetch("/api/admin/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cancelled) return;
          if (meRes.ok) {
            const meData = (await meRes.json()) as { isAdmin?: boolean };
            if (meData.isAdmin) {
              router.replace("/admin/dashboard");
              setChecked(true);
              return;
            }
          }
        }
      } catch {
        // ignore; continue to onboarding check
      }
      if (cancelled) return;

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
  }, [canRedirect, isLoggedIn, pathname, router]);

  if (!canRedirect || (!checked && isLoggedIn === true)) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
