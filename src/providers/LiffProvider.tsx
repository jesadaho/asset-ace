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
      const loggedIn = liff.isLoggedIn();
      setIsLoggedIn(loggedIn);
      // #region agent log
      fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'B',location:'LiffProvider.tsx:init',message:'LIFF init done',data:{isLoggedIn:loggedIn},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      if (liff.isLoggedIn()) {
        const profileData = await liff.getProfile();
        // #region agent log
        fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'C',location:'LiffProvider.tsx:getProfile',message:'Raw profile from LINE',data:{hasPictureUrl:!!profileData.pictureUrl,pictureUrlLen:profileData.pictureUrl?.length,hasDisplayName:!!profileData.displayName},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setProfile({
          userId: profileData.userId,
          displayName: profileData.displayName ?? "",
          pictureUrl: profileData.pictureUrl,
          statusMessage: profileData.statusMessage,
        });
      }
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'D',location:'LiffProvider.tsx:catch',message:'LIFF init error',data:{message:err instanceof Error?err.message:String(err)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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
