"use client";

import { LiffProvider } from "@/providers/LiffProvider";
import { OnboardingGuard } from "./OnboardingGuard";

interface LiffWrapperProps {
  children: React.ReactNode;
}

export function LiffWrapper({ children }: LiffWrapperProps) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID ?? "";

  return (
    <LiffProvider liffId={liffId}>
      <OnboardingGuard>{children}</OnboardingGuard>
    </LiffProvider>
  );
}
