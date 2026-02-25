"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect /agent/my-works to /agents (My Work page).
 * LIFF may open this path; the canonical route is /agents.
 */
export default function AgentMyWorksPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/agents");
  }, [router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent" />
    </div>
  );
}
