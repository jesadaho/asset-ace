"use client";

import dynamic from "next/dynamic";

const DotLottieReact = dynamic(
  () =>
    import("@lottiefiles/dotlottie-react").then((m) => m.DotLottieReact),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full w-full rounded-xl bg-slate-100 animate-pulse"
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

/**
 * Sandy DotLottie — use only while LIFF is opening (OnboardingGuard).
 * Other screens should use the green spinner or skeletons.
 */
export function LiffLoadingAnimation({ size = 160, className }: Props) {
  return (
    <div
      className={className}
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
    >
      <div className="h-full w-full overflow-hidden rounded-xl">
        <DotLottieReact
          src="/lottie/sandy-loading.lottie"
          loop
          autoplay
          style={{ width: size, height: size }}
        />
      </div>
    </div>
  );
}
