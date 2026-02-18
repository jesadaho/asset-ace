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
  const [error, setError] = useState<string | null>(null);

  const initLiff = useCallback(async () => {
    if (!liffId) {
      setError("LIFF ID is not configured");
      setIsReady(true);
      return;
    }

    try {
      await liff.init({ liffId });
      setIsLoggedIn(liff.isLoggedIn());

      if (liff.isLoggedIn()) {
        const profileData = await liff.getProfile();
        setProfile({
          userId: profileData.userId,
          displayName: profileData.displayName ?? "",
          pictureUrl: profileData.pictureUrl,
          statusMessage: profileData.statusMessage,
        });
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
