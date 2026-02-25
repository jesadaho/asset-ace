"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLiff } from "@/providers/LiffProvider";
import {
  checkOnboardingStatus,
  getRoleDashboardPath,
} from "@/lib/api/onboarding";

const ONBOARDING_PATH = "/onboarding";
const ADD_FRIEND_REQUIRED_PATH = "/add-friend-required";
const INVITE_PATH = "/invite";

const ALLOWED_PATHS = [
  "/",
  ONBOARDING_PATH,
  ADD_FRIEND_REQUIRED_PATH,
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
  const searchParams = useSearchParams();
  const { isReady, isLoggedIn, profile, liffId, error, isFriend } = useLiff();
  const [checked, setChecked] = useState(false);

  const invitePropId = pathname === INVITE_PATH ? searchParams.get("propId") : null;
  /** รับงาน flow: on /invite?propId=xxx — wait for run() before showing invite page so we can redirect to onboarding without flashing invite. */
  const isInviteAcceptJob = Boolean(invitePropId?.trim());

  const canRedirect = isReady && (!liffId || isLoggedIn === false || profile !== null || error !== null);

  // Redirect based on liff.state/path/redirect only after LIFF state is resolved (skip when user must add friend first)
  useEffect(() => {
    if (!canRedirect) return;
    if (isLoggedIn === true && isFriend === false && pathname !== ADD_FRIEND_REQUIRED_PATH) return;
    const queryPath = getIntendedPathFromQuery();
    if (queryPath && pathname !== queryPath) {
      router.replace(queryPath);
    }
  }, [canRedirect, isLoggedIn, isFriend, pathname, router]);

  useEffect(() => {
    if (!canRedirect) {
      if (pathname !== INVITE_PATH) setChecked(true);
      return;
    }
    if (isLoggedIn !== true && !isInviteAcceptJob && pathname !== INVITE_PATH) {
      setChecked(true);
      return;
    }
    if (pathname === ADD_FRIEND_REQUIRED_PATH) {
      setChecked(true);
      return;
    }
    if (isFriend === false) {
      router.replace(ADD_FRIEND_REQUIRED_PATH);
      setChecked(true);
      return;
    }

    let cancelled = false;

    async function run() {
      if (pathname.startsWith("/admin")) {
        setChecked(true);
        return;
      }

      if (pathname === INVITE_PATH) {
        if (!invitePropId?.trim()) {
          setChecked(true);
          return;
        }
        if (isLoggedIn !== true) {
          setChecked(true);
          // #region agent log
          fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'H_invite',location:'OnboardingGuard.tsx',message:'Invite accept-job: not logged in, show invite page',data:{invitePropId},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          return;
        }
        const status = await checkOnboardingStatus();
        if (cancelled) return;
        if (!status.onboarded) {
          const onboardingUrl = `${ONBOARDING_PATH}?role=agent&propId=${encodeURIComponent(invitePropId.trim())}`;
          // #region agent log
          fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'H_invite',location:'OnboardingGuard.tsx',message:'Invite accept-job: redirect to onboarding',data:{onboardingUrl,invitePropId},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          router.replace(onboardingUrl);
        } else {
          setChecked(true);
        }
        return;
      }

      // No auto-redirect to /admin/dashboard; admin only when user opens /admin/* directly.
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
  }, [canRedirect, isLoggedIn, isFriend, pathname, router, invitePropId, isInviteAcceptJob]);

  /** On /invite always show loading until run() has decided (avoids flash when searchParams not ready on first paint). */
  const showLoading =
    !canRedirect ||
    (!checked && (isLoggedIn === true || isInviteAcceptJob || pathname === INVITE_PATH));
  if (showLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
