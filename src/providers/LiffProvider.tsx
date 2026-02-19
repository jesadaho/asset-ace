"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import liff from "@line/liff";

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface LiffContextValue {
  isReady: boolean;
  isLoggedIn: boolean | null;
  profile: LiffProfile | null;
  openId: string | null;
  scope: string[] | null;
  error: string | null;
  liffId: string;
  login: () => void;
  logout: () => void;
}

const LiffContext = createContext<LiffContextValue | undefined>(undefined);

export function useLiff() {
  const context = useContext(LiffContext);
  if (context === undefined) {
    throw new Error("useLiff must be used within a LiffProvider");
  }
  return context;
}

interface LiffProviderProps {
  children: React.ReactNode;
  liffId: string;
}

export function LiffProvider({ children, liffId }: LiffProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [scope, setScope] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initLiff = useCallback(async () => {
    if (!liffId) {
      setError("LIFF ID is not configured. On Vercel: Project → Settings → Environment Variables → add NEXT_PUBLIC_LIFF_ID, then redeploy.");
      setIsReady(true);
      return;
    }

    try {
      await liff.init({ liffId });
      const loggedIn = liff.isLoggedIn();
      setIsLoggedIn(loggedIn);

      if (liff.isLoggedIn()) {
        const ctx = liff.getContext();
        if (ctx?.scope) setScope(ctx.scope);

        let idToken: { sub?: string } | null = null;
        try {
          idToken = liff.getDecodedIDToken?.() ?? null;
          if (idToken?.sub) setOpenId(idToken.sub);
        } catch {
          // openid scope may not be granted
        }

        try {
          const profileData = await liff.getProfile();
          setProfile({
            userId: profileData.userId,
            displayName: profileData.displayName ?? "",
            pictureUrl: profileData.pictureUrl,
            statusMessage: profileData.statusMessage,
          });
        } catch (profileErr) {
          const msg = profileErr instanceof Error ? profileErr.message : String(profileErr);
          setError(`Profile: ${msg}. Unlink this app in LINE Settings > Linked apps, then open again.`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize LIFF");
    } finally {
      setIsReady(true);
    }
  }, [liffId]);

  useEffect(() => {
    initLiff();
  }, [initLiff]);

  const login = useCallback(() => {
    if (liffId && !liff.isLoggedIn()) {
      liff.login();
    }
  }, [liffId]);

  const logout = useCallback(() => {
    if (liff.isLoggedIn()) {
      liff.logout();
      window.location.reload();
    }
  }, []);

  const value: LiffContextValue = {
    isReady,
    isLoggedIn,
    profile,
    openId,
    scope,
    error,
    liffId,
    login,
    logout,
  };

  return (
    <LiffContext.Provider value={value}>
      {children}
    </LiffContext.Provider>
  );
}
