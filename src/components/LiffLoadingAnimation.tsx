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

/** Sandy loading animation for LIFF / onboarding gate (DotLottie from `public/lottie/sandy-loading.lottie`). */
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

type BlockProps = {
  label?: string;
  size?: number;
  className?: string;
};

/** Centered Sandy + optional caption (full-screen gates, access checks, list fetch). */
export function LiffLoadingBlock({ label, size = 128, className }: BlockProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className ?? ""}`}
    >
      <LiffLoadingAnimation size={size} />
      {label ? (
        <p className="text-slate-600 text-sm text-center">{label}</p>
      ) : null}
    </div>
  );
}

/** Compact row for section-level loading (e.g. รายการส่วนเสริม). */
export function LiffLoadingInline({
  label,
  size = 40,
  className,
}: {
  label?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
      role="status"
    >
      <LiffLoadingAnimation size={size} />
      {label ? (
        <span className="text-sm text-slate-500">{label}</span>
      ) : null}
    </div>
  );
}
