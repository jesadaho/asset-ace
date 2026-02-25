"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect /agent/setting to /agent/settings.
 * Supports LIFF URLs that use the singular path (e.g. .../agent/setting).
 */
export default function AgentSettingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/agent/settings");
  }, [router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent" />
    </div>
  );
}
