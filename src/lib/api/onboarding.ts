const ONBOARDING_STORAGE_KEY = "asset-ace-onboarding";

export interface OnboardingData {
  role: "owner" | "agent" | "tenant";
  name: string;
  phone: string;
}

export interface OnboardingStatus {
  onboarded: boolean;
  role?: string;
}

function getRolePath(role: string): string {
  const map: Record<string, string> = {
    owner: "/owners",
    agent: "/agents",
    tenant: "/tenants",
  };
  return map[role] ?? "/tenants";
}

async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const liff = (await import("@line/liff")).default;
    return liff.getAccessToken();
  } catch {
    return null;
  }
}

export async function submitOnboarding(data: OnboardingData): Promise<void> {
  const payload = {
    role: data.role,
    name: data.name,
    phone: data.phone,
  };

  const token = await getAccessToken();

  if (token) {
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? "Failed to submit");
    }
  } else {
    // Mock: persist to localStorage when no LIFF token (web dev)
    if (typeof window !== "undefined") {
      localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({ ...payload, onboarded: true })
      );
    }
  }
}

export async function checkOnboardingStatus(): Promise<OnboardingStatus> {
  const token = await getAccessToken();

  if (token) {
    const res = await fetch("/api/onboarding", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { onboarded: false };
    const data = (await res.json()) as OnboardingStatus;
    return data;
  }

  // Mock: read from localStorage when no LIFF token (web dev)
  if (typeof window === "undefined") return { onboarded: false };
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) return { onboarded: false };
    const parsed = JSON.parse(stored) as { onboarded?: boolean; role?: string };
    return {
      onboarded: Boolean(parsed.onboarded),
      role: parsed.role,
    };
  } catch {
    return { onboarded: false };
  }
}

export function getRoleDashboardPath(role: string): string {
  return getRolePath(role);
}
