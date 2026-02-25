"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { useLiff } from "@/providers/LiffProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const PHONE_REGEX = /^[\d\s\-+()]{8,20}$/;

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && PHONE_REGEX.test(phone);
}

type ProfileState = {
  name: string;
  phone: string;
  lineId: string;
  paymentInfo: string;
  notificationsEnabled: boolean;
};

export default function AgentSettingsPage() {
  const router = useRouter();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const { isReady, isLoggedIn, profile, logout } = useLiff();

  const [data, setData] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    const liff = (await import("@line/liff")).default;
    const token = liff.getAccessToken();
    if (!token) {
      setError(tAuth("pleaseLogin"));
      setLoading(false);
      return;
    }
    const res = await fetch("/api/agent/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) {
      setError(t("accessDeniedAgent"));
      setLoading(false);
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? t("failedToLoad"));
      setLoading(false);
      return;
    }
    const body = await res.json();
    setData({
      name: body.name ?? "",
      phone: body.phone ?? "",
      lineId: body.lineId ?? "",
      paymentInfo: body.paymentInfo ?? "",
      notificationsEnabled: body.notificationsEnabled ?? true,
    });
    setError(null);
    setLoading(false);
  }, [t, tAuth]);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) {
      setError(tAuth("pleaseLogin"));
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [isReady, isLoggedIn, fetchProfile]);

  const patchProfile = useCallback(
    async (updates: Partial<ProfileState>) => {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) return false;
      const res = await fetch("/api/agent/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? t("failedToSave"));
        return false;
      }
      const body = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              name: body.name ?? prev.name,
              phone: body.phone ?? prev.phone,
              lineId: body.lineId ?? prev.lineId,
              paymentInfo: body.paymentInfo ?? prev.paymentInfo,
              notificationsEnabled: body.notificationsEnabled ?? prev.notificationsEnabled,
            }
          : null
      );
      setError(null);
      return true;
    },
    [t]
  );

  const handleSave = async () => {
    if (!data) return;
    if (!data.name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    if (!data.phone.trim()) {
      setPhoneError(t("invalidPhone"));
      return;
    }
    if (!isValidPhone(data.phone)) {
      setPhoneError(t("invalidPhone"));
      return;
    }
    setPhoneError(null);
    setSaveLoading(true);
    try {
      const ok = await patchProfile({
        name: data.name.trim(),
        phone: data.phone.trim(),
        lineId: data.lineId.trim(),
        paymentInfo: data.paymentInfo,
      });
      if (ok) setError(null);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleNotificationsToggle = async () => {
    if (!data) return;
    const next = !data.notificationsEnabled;
    setData((prev) => (prev ? { ...prev, notificationsEnabled: next } : null));
    await patchProfile({ notificationsEnabled: next });
  };

  const handleUnlink = () => {
    setUnlinkConfirmOpen(false);
    logout();
  };

  if (!isReady || loading) {
    return (
      <div className="min-h-full bg-[#F8FAFC] p-4">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-2 py-4">
            <div className="h-5 w-5 shrink-0 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" aria-hidden />
            <p className="text-slate-600 text-sm">{tCommon("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-full bg-[#F8FAFC] p-4">
        <div className="max-w-lg mx-auto">
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-[#0F172A] hover:text-[#003366] py-2"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
            <span>{t("title")}</span>
          </Link>
          <p className="mt-4 text-red-600 text-sm" role="alert">
            {error}
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push("/agents")}
          >
            Back to My Work
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F8FAFC] p-4 pb-8">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <header className="flex items-center gap-2">
          <Link
            href="/agents"
            className="shrink-0 flex items-center justify-center p-2 -m-2 text-[#0F172A] hover:text-[#003366] tap-target min-h-[44px] min-w-[44px]"
            aria-label={t("title")}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="min-w-0 flex-1 text-lg font-semibold text-[#0F172A] text-center truncate">
            {t("title")}
          </h1>
          <div className="w-9 shrink-0" aria-hidden />
        </header>

        {error && (
          <p className="text-red-600 text-sm" role="alert">
            {error}
          </p>
        )}

        {/* 1. My Profile */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            {t("myProfile")}
          </h2>
          <div className="flex items-center gap-4 mb-4">
            {profile?.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt=""
                className="h-14 w-14 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-lg font-medium">
                {profile?.displayName?.slice(0, 1) ?? "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500 mb-0.5">{t("lineNameReadOnly")}</p>
              <p className="text-base font-medium text-[#0F172A] truncate">
                {profile?.displayName ?? "—"}
              </p>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="settings-display-name" className="block text-sm font-medium text-[#0F172A] mb-1">
              {t("displayNameInApp")}
            </label>
            <Input
              id="settings-display-name"
              type="text"
              value={data?.name ?? ""}
              onChange={(e) =>
                setData((prev) => (prev ? { ...prev, name: e.target.value } : null))
              }
              placeholder={t("displayNameInAppPlaceholder")}
              autoComplete="name"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="settings-phone" className="block text-sm font-medium text-[#0F172A] mb-1">
              {t("contactPhone")}
            </label>
            <Input
              id="settings-phone"
              type="tel"
              value={data?.phone ?? ""}
              onChange={(e) => {
                setData((prev) => (prev ? { ...prev, phone: e.target.value } : null));
                setPhoneError(null);
              }}
              placeholder={t("contactPhonePlaceholder")}
              error={Boolean(phoneError)}
              autoComplete="tel"
            />
            {phoneError && (
              <p className="mt-1.5 text-sm text-red-500">{phoneError}</p>
            )}
          </div>
          <div>
            <label htmlFor="settings-line-id" className="block text-sm font-medium text-[#0F172A] mb-1">
              {t("lineIdOptional")}
            </label>
            <Input
              id="settings-line-id"
              type="text"
              value={data?.lineId ?? ""}
              onChange={(e) =>
                setData((prev) => (prev ? { ...prev, lineId: e.target.value } : null))
              }
              placeholder={t("lineIdPlaceholder")}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-slate-500">
              {t("lineIdOptionalDescriptionAgent")}
            </p>
          </div>
        </section>

        {/* 2. Management */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            {t("management")}
          </h2>
          <div>
            <label htmlFor="settings-payment" className="block text-sm font-medium text-[#0F172A] mb-1">
              {t("paymentInfo")}
            </label>
            <textarea
              id="settings-payment"
              value={data?.paymentInfo ?? ""}
              onChange={(e) =>
                setData((prev) => (prev ? { ...prev, paymentInfo: e.target.value } : null))
              }
              placeholder={t("paymentInfoPlaceholder")}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-[#0F172A] placeholder:text-[#0F172A]/50 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 focus:border-transparent min-h-[44px]"
            />
          </div>
        </section>

        {/* 3. System */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            {t("system")}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#0F172A]">
                  {t("notifications")}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("notificationsDescription")}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={data?.notificationsEnabled ?? true}
                onClick={handleNotificationsToggle}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 tap-target ${
                  data?.notificationsEnabled !== false
                    ? "bg-[#10B981] border-[#10B981]"
                    : "bg-slate-100 border-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform ${
                    data?.notificationsEnabled !== false
                      ? "translate-x-5"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <div>
              {!unlinkConfirmOpen ? (
                <button
                  type="button"
                  onClick={() => setUnlinkConfirmOpen(true)}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline"
                >
                  {t("unlinkAccount")}
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-600">{t("unlinkConfirm")}</span>
                  <button
                    type="button"
                    onClick={handleUnlink}
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    {t("unlinkAccount")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnlinkConfirmOpen(false)}
                    className="text-sm text-slate-600 hover:underline"
                  >
                    {t("cancel")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <Button
          type="button"
          onClick={handleSave}
          isLoading={saveLoading}
          disabled={!data}
          className="w-full"
        >
          {saveLoading ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
