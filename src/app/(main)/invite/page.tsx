"use client";

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "next/navigation";
import { useTranslations } from "next-intl";
import { Building2 } from "lucide-react";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  Condo: "Condo",
  House: "House",
  Apartment: "Apartment",
};

type PropertyInvite = { name: string; address: string; type?: string };

export default function InviteLandingPage() {
  const searchParams = useSearchParams();
  const propId = searchParams.get("propId");
  const t = useTranslations("invite");

  const [property, setProperty] = useState<PropertyInvite | null>(null);
  const [loading, setLoading] = useState(!!propId);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
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

  const onboardingUrl = `/onboarding?role=agent&propId=${encodeURIComponent(propId ?? "")}`;

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
          <Link
            href={onboardingUrl}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#10B981] text-white font-medium hover:bg-[#10B981]/90 tap-target min-h-[48px]"
          >
            {t("ctaAccept")}
          </Link>
        </div>
      </div>
    </div>
  );
}
