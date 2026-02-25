"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLiff } from "@/providers/LiffProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  submitOnboarding,
  getRoleDashboardPath,
  type OnboardingData,
} from "@/lib/api/onboarding";
import { User, Building2, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

type PropertySummary = { name: string; address: string; type?: string };

const ROLE_OPTIONS: { value: OnboardingData["role"]; labelKey: "roleOwner" | "roleAgent" | "roleTenant"; icon: typeof Building2 }[] = [
  { value: "owner", labelKey: "roleOwner", icon: Building2 },
  { value: "agent", labelKey: "roleAgent", icon: User },
  { value: "tenant", labelKey: "roleTenant", icon: Home },
];

const PHONE_REGEX = /^[\d\s\-+()]{8,20}$/;

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && PHONE_REGEX.test(phone);
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("onboarding");
  const tAuth = useTranslations("auth");
  const { isReady, isLoggedIn, profile, error, login } = useLiff();
  const isAgentFlow = searchParams.get("role") === "agent";
  const propId = searchParams.get("propId") ?? null;

  const [step, setStep] = useState<1 | 2>(isAgentFlow ? 2 : 1);
  const [role, setRole] = useState<OnboardingData["role"] | "">(isAgentFlow ? "agent" : "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [propertySummary, setPropertySummary] = useState<PropertySummary | null>(null);
  const [propertySummaryError, setPropertySummaryError] = useState(false);
  /** When true, invite API has completed for agent flow; we can show onboarding UI. */
  const [agentInviteLoaded, setAgentInviteLoaded] = useState(false);

  useEffect(() => {
    if (!isAgentFlow || !propId) return;
    setAgentInviteLoaded(false);
    // #region agent log
    fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'H2',location:'onboarding/page.tsx',message:'Agent invite load started',data:{propId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    let cancelled = false;
    fetch(`/api/properties/${encodeURIComponent(propId)}/invite`)
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setPropertySummaryError(true);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        setPropertySummary({ name: data.name, address: data.address, type: data.type });
      })
      .catch(() => {
        if (!cancelled) setPropertySummaryError(true);
      })
      .finally(() => {
        if (!cancelled) {
          setAgentInviteLoaded(true);
          // #region agent log
          fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'H1',location:'onboarding/page.tsx',message:'Agent invite fetch completed',data:{propId},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        }
      });
    return () => { cancelled = true; };
  }, [isAgentFlow, propId]);

  /** For agent invite flow: show full-page loading until invite API has completed. */
  const isAgentInviteLoading = Boolean(isAgentFlow && propId && !agentInviteLoaded);

  const validateStep2 = (): boolean => {
    const next: { name?: string; phone?: string } = {};
    if (!name.trim()) next.name = t("nameRequired");
    if (!phone.trim()) next.phone = t("phoneRequired");
    else if (!isValidPhone(phone)) next.phone = t("phoneInvalid");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateStep2()) return;

    const submitRole = (isAgentFlow ? "agent" : role) as OnboardingData["role"];
    if (!submitRole) return;

    setIsSubmitting(true);
    try {
      await submitOnboarding({
        role: submitRole,
        name: name.trim(),
        phone: phone.trim(),
        propId: isAgentFlow && propId ? propId : undefined,
      });
      router.push(getRoleDashboardPath(submitRole));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("submitErrorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAgentInviteLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-[#0F172A] safe-area-top">
      <div className="max-w-lg mx-auto px-4 py-12">
        <header className="text-center mb-8">
          <div className="flex flex-col items-center gap-3 mb-4">
            {profile?.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName || t("profile")}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-[#10B981]/30"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/10 text-[#10B981]">
                <User className="h-8 w-8" aria-hidden />
              </div>
            )}
            {profile?.displayName && (
              <p className="text-[#0F172A] font-medium">{profile.displayName}</p>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mb-2">
            {isAgentFlow ? t("welcomeAgent") : t("welcomeTitle")}
          </h1>
          <p className="text-slate-600 text-base">
            {isAgentFlow
              ? t("profileSetupForAgent")
              : step === 1
                ? t("chooseRole")
                : t("completeProfile")}
          </p>
        </header>

        {isAgentFlow && propId && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-[#0F172A] mb-2">
              {t("propertySummary")}
            </h2>
            {propertySummaryError && (
              <p className="text-slate-500 text-sm">{t("propertyNotFound")}</p>
            )}
            {propertySummary && !propertySummaryError && (
              <div className="text-sm text-slate-600 space-y-1">
                <p className="font-medium text-[#0F172A]">{propertySummary.name}</p>
                {propertySummary.type && (
                  <p>{propertySummary.type}</p>
                )}
                <p>{propertySummary.address}</p>
              </div>
            )}
          </div>
        )}

        {isReady && isLoggedIn === false && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-amber-800 text-sm mb-3">
              {tAuth("pleaseLogin")}
            </p>
            <Button type="button" onClick={login} size="lg" className="w-full">
              {t("logInWithLine")}
            </Button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!isAgentFlow && step === 1 ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-700 mb-2">{t("iAm")}</p>
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = role === opt.value;
              const isTenant = opt.value === "tenant";
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isTenant}
                  aria-disabled={isTenant}
                  onClick={() => {
                    if (isTenant) return;
                    setRole(opt.value);
                    setStep(2);
                  }}
                  className={`w-full text-left ${isTenant ? "cursor-not-allowed opacity-60 pointer-events-none" : ""}`}
                >
                  <Card
                    variant="light"
                    className={`transition-colors min-h-[60px] ${
                      isTenant
                        ? "border-slate-200 bg-slate-50"
                        : selected
                          ? "border-[#10B981] bg-emerald-50 cursor-pointer tap-target"
                          : "border-slate-200 bg-white hover:border-[#10B981]/50 cursor-pointer tap-target"
                    }`}
                  >
                    <CardContent className="flex items-center gap-4 py-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          selected ? "bg-[#10B981]/20 text-[#10B981]" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="h-6 w-6" aria-hidden />
                      </div>
                      <span className="text-lg font-medium text-[#0F172A]">{t(opt.labelKey)}</span>
                      {isTenant && (
                        <span className="ml-auto text-slate-400 text-sm">({t("tenantDisabled")})</span>
                      )}
                      {selected && !isTenant && (
                        <span className="ml-auto text-[#10B981] text-sm font-medium">
                          {t("selected")}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isAgentFlow && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-slate-600 hover:text-[#0F172A] mb-2"
              >
                {t("changeRole")}
              </button>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#0F172A] mb-2">
                {t("fullName")}
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("fullNamePlaceholder")}
                error={Boolean(errors.name)}
                autoComplete="name"
              />
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#0F172A] mb-2">
                {t("phoneNumber")}
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
                error={Boolean(errors.phone)}
                autoComplete="tel"
              />
              {errors.phone && (
                <p className="mt-1.5 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-red-500" role="alert">{submitError}</p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              disabled={!isReady}
            >
              {t("completeSetup")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
