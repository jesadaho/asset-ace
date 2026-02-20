const ONBOARDING_STORAGE_KEY = "asset-ace-onboarding";

export interface OnboardingData {
  role: "owner" | "agent" | "tenant";
  name: string;
  phone: string;
  propId?: string;
}

export interface OnboardingStatus {
  onboarded: boolean;
  role?: string;
}

function getRolePath(role: string): string {
  const map: Record<string, string> = {
    owner: "/owner/dashboard",
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

export interface OnboardingSubmitError {
  message: string;
  detail?: string;
  status: number;
}

export interface OnboardingSuccessResponse {
  success: true;
  debug?: {
    richMenu?: {
      attempted: boolean;
      linked: boolean;
      status?: number;
      message?: string;
      richMenuId?: string;
    };
  };
}

export async function submitOnboarding(data: OnboardingData): Promise<OnboardingSuccessResponse | void> {
  const payload: Record<string, string> = {
    role: data.role,
    name: data.name,
    phone: data.phone,
  };
  if (data.propId) payload.propId = data.propId;

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
      const err = (await res.json().catch(() => ({}))) as { message?: string; detail?: string };
      const submitErr: OnboardingSubmitError = {
        message: err.message ?? "Failed to submit",
        detail: err.detail,
        status: res.status,
      };
      throw submitErr;
    }
    const json = (await res.json()) as OnboardingSuccessResponse;
    return json;
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
