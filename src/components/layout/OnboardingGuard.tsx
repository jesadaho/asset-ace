"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLiff } from "@/providers/LiffProvider";
import {
  checkOnboardingStatus,
  getRoleDashboardPath,
} from "@/lib/api/onboarding";
import { getDeepLinkTargetFromSearchParams } from "@/lib/deep-link";
import { LiffLoadingAnimation } from "@/components/LiffLoadingAnimation";

const ONBOARDING_PATH = "/onboarding";
const ADD_FRIEND_REQUIRED_PATH = "/add-friend-required";
const OPEN_IN_LINE_PATH = "/open-in-line";
const INVITE_PATH = "/invite";
const ADD_PROPERTY_PATH = "/owner/properties/add";

/** Paths that are allowed when opened in external browser (not LINE in-app). */
function isAllowedInExternalBrowser(pathname: string): boolean {
  if (pathname === "/" || pathname === "/enter" || pathname === OPEN_IN_LINE_PATH) return true;
  if (pathname.startsWith("/listings/") || pathname.startsWith("/admin/")) return true;
  return false;
}

function getAddFriendRequiredRedirect(pathname: string): string {
  const normalized = pathname.split("?")[0];
  if (normalized === ADD_PROPERTY_PATH) {
    return `${ADD_FRIEND_REQUIRED_PATH}?path=${encodeURIComponent(ADD_PROPERTY_PATH)}`;
  }
  return ADD_FRIEND_REQUIRED_PATH;
}

function getIntendedPathFromQuery(): string | null {
  if (typeof window === "undefined") return null;
  return getDeepLinkTargetFromSearchParams(
    new URLSearchParams(window.location.search)
  );
}

function hasDeepLinkSearchParams(): boolean {
  if (typeof window === "undefined") return false;
  const sp = new URLSearchParams(window.location.search);
  return sp.has("path") || sp.has("redirect") || sp.has("liff.state");
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isReady, isLoggedIn, profile, liffId, error, isFriend, isInClient } = useLiff();
  const [checked, setChecked] = useState(false);

  /** LIFF opens endpoint URL (often `/`) first; `path` / `liff.state` may arrive in query. Avoid flashing the landing page before client redirect. */
  const deepLinkTarget = getDeepLinkTargetFromSearchParams(searchParams);
  const normalizedPathname = pathname.split("?")[0];
  const isPendingDeepLinkNavigation = Boolean(
    deepLinkTarget && deepLinkTarget !== normalizedPathname
  );

  // Redirect to "open in LINE" page when link is opened in external browser (not in LINE app)
  useEffect(() => {
    if (!isReady || !liffId || isInClient) return;
    if (isAllowedInExternalBrowser(pathname)) return;
    router.replace(OPEN_IN_LINE_PATH);
  }, [isReady, liffId, isInClient, pathname, router]);

  const invitePropId = pathname === INVITE_PATH ? searchParams.get("propId") : null;
  /** รับงาน flow: on /invite?propId=xxx — wait for run() before showing invite page so we can redirect to onboarding without flashing invite. */
  const isInviteAcceptJob = Boolean(invitePropId?.trim());

  const canRedirect = isReady && (!liffId || isLoggedIn === false || profile !== null || error !== null);

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
    if (pathname === OPEN_IN_LINE_PATH) {
      setChecked(true);
      return;
    }
    if (isFriend === false) {
      router.replace(getAddFriendRequiredRedirect(pathname));
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
          return;
        }
        setChecked(true);
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
        return;
      }

      // Note: don't "clean up" deep-link query via `router.replace(pathname)` here.
      // LIFF often mutates `path` / `redirect` / `liff.state` which can remount this
      // guard and re-trigger the logo loader. Real navigation decisions are handled
      // by the `targetPath` logic above.

      setChecked(true);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [canRedirect, isLoggedIn, isFriend, pathname, router, invitePropId, isInviteAcceptJob, searchParams]);

  /** On /invite always show loading until run() has decided (avoids flash when searchParams not ready on first paint). */
  const showLoading =
    !canRedirect ||
    isPendingDeepLinkNavigation ||
    (!checked && (isLoggedIn === true || isInviteAcceptJob || pathname === INVITE_PATH));
  if (showLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <LiffLoadingAnimation size={168} />
      </div>
    );
  }

  return <>{children}</>;
}
