"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Building2, Briefcase } from "lucide-react";
import { checkOnboardingStatus } from "@/lib/api/onboarding";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  Condo: "Condo",
  House: "House",
  Apartment: "Apartment",
};

type PropertyInvite = { name: string; address: string; type?: string };

export default function InviteLandingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const propId = searchParams.get("propId");
  const t = useTranslations("invite");

  const [property, setProperty] = useState<PropertyInvite | null>(null);
  const [loading, setLoading] = useState(!!propId);
  const [error, setError] = useState<string | null>(null);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [checkingAlreadyAccepted, setCheckingAlreadyAccepted] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    if (!propId?.trim()) {
      setLoading(false);
      setError(t("propertyNotFound"));
      return;
    }
    let cancelled = false;
    fetch(`/api/properties/${encodeURIComponent(propId)}/invite`)
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError(t("propertyNotFound"));
          setProperty(null);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        setProperty({
          name: data.name ?? "",
          address: data.address ?? "",
          type: data.type,
        });
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError(t("failedToLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [propId, t]);

  useEffect(() => {
    if (!propId?.trim() || !property) return;
    let cancelled = false;
    (async () => {
      try {
        const liff = (await import("@line/liff")).default;
        if (!liff.isLoggedIn()) return;
        const token = liff.getAccessToken();
        if (!token) return;
        if (!cancelled) setCheckingAlreadyAccepted(true);
        const res = await fetch(`/api/agent/property/${propId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as { isManagingAgent?: boolean };
          if (data.isManagingAgent && !cancelled) setAlreadyAccepted(true);
        }
      } finally {
        if (!cancelled) setCheckingAlreadyAccepted(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propId, property]);

  useEffect(() => {
    if (!propId?.trim() || !property || alreadyAccepted) return;
    let cancelled = false;
    checkOnboardingStatus().then((status) => {
      if (!cancelled) setIsOnboarded(status.onboarded);
    });
    return () => {
      cancelled = true;
    };
  }, [propId, property, alreadyAccepted]);

  const handleAcceptInvite = async () => {
    if (!propId?.trim() || acceptLoading) return;
    setAcceptLoading(true);
    setAcceptError(null);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        setAcceptError(t("propertyNotFound"));
        setAcceptLoading(false);
        return;
      }
      const res = await fetch("/api/agent/accept-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ propId: propId.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setAcceptError(data.message ?? t("failedToLoad"));
        setAcceptLoading(false);
        return;
      }
      router.push("/agents");
    } catch {
      setAcceptError(t("failedToLoad"));
    } finally {
      setAcceptLoading(false);
    }
  };

  if (loading || checkingAlreadyAccepted) {
    return (
      <div className="min-h-dvh bg-slate-50 text-[#0F172A] safe-area-top">
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-slate-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-dvh bg-slate-50 text-[#0F172A] safe-area-top">
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-red-600" role="alert">
            {error ?? t("propertyNotFound")}
          </p>
        </div>
      </div>
    );
  }

  if (alreadyAccepted) {
    return (
      <div className="min-h-dvh bg-slate-50 text-[#0F172A] safe-area-top">
        <div className="max-w-lg mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-xl font-bold text-[#0F172A] mb-2">
              {t("alreadyAccepted")}
            </h1>
            <p className="text-slate-600 text-sm">{property.name}</p>
          </header>
          <div className="flex flex-col gap-3">
            <Link
              href="/agents"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#10B981] text-white font-medium hover:bg-[#10B981]/90 tap-target min-h-[48px]"
            >
              <Briefcase className="h-5 w-5" aria-hidden />
              {t("goToMyWork")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onboardingUrl = `/onboarding?role=agent&propId=${encodeURIComponent(propId ?? "")}`;

  const showAcceptButton = isOnboarded !== null;

  return (
    <div className="min-h-dvh bg-slate-50 text-[#0F172A] safe-area-top">
      <div className="max-w-lg mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-xl font-bold text-[#0F172A] mb-2">
            {t("headline")}
          </h1>
          <p className="text-slate-600 text-sm">{t("benefits")}</p>
        </header>

        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#10B981]" aria-hidden />
            {t("propertyYouWillManage")}
          </h2>
          <div className="space-y-1 text-sm text-slate-600">
            <p className="font-medium text-[#0F172A]">{property.name}</p>
            {property.type && (
              <p>{PROPERTY_TYPE_LABELS[property.type] ?? property.type}</p>
            )}
            <p>{property.address}</p>
          </div>
        </section>

        <div className="flex flex-col gap-3">
          {acceptError && (
            <p className="text-red-600 text-sm" role="alert">
              {acceptError}
            </p>
          )}
          {showAcceptButton ? (
            isOnboarded ? (
              <button
                type="button"
                onClick={handleAcceptInvite}
                disabled={acceptLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#10B981] text-white font-medium hover:bg-[#10B981]/90 tap-target min-h-[48px] disabled:opacity-60"
              >
                {acceptLoading ? t("loading") : t("ctaAccept")}
              </button>
            ) : (
              <Link
                href={onboardingUrl}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#10B981] text-white font-medium hover:bg-[#10B981]/90 tap-target min-h-[48px]"
              >
                {t("ctaAccept")}
              </Link>
            )
          ) : (
            <div className="w-full flex items-center justify-center py-3 px-4 min-h-[48px] text-slate-500 text-sm">
              {t("loading")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
