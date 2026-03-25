"use client";

import dynamic from "next/dynamic";

const DotLottieReact = dynamic(
  () =>
    import("@lottiefiles/dotlottie-react").then((m) => m.DotLottieReact),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent"
        aria-hidden
      />
    ),
  }
);

type Props = {
  /** Display size in CSS pixels */
  size?: number;
  className?: string;
};

/** Sandy loading animation for LIFF / onboarding gate (DotLottie from `public/lottie/sandy-loading.lottie`). */
export function LiffLoadingAnimation({ size = 160, className }: Props) {
  return (
    <div
      className={className}
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
    >
      <DotLottieReact
        src="/lottie/sandy-loading.lottie"
        loop
        autoplay
        style={{ width: size, height: size }}
      />
    </div>
  );
}
