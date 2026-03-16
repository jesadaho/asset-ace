"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, BellRing, MessageCircle, ShieldCheck, UserPlus } from "lucide-react";
import { useLiff } from "@/providers/LiffProvider";

const ADD_FRIEND_URL_BASE = "https://line.me/R/ti/p/";
const DEFAULT_TARGET_PATH = "/owner/properties/add";
const ALLOWED_TARGET_PATHS = new Set([DEFAULT_TARGET_PATH]);

export default function AddFriendRequiredPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("addFriendRequired");
  const { isReady, isLoggedIn, isFriend } = useLiff();
  const lineOfficialId = process.env.NEXT_PUBLIC_LINE_OFFICIAL_ID ?? "";
  const addFriendUrl = lineOfficialId
    ? `${ADD_FRIEND_URL_BASE}${lineOfficialId}`
    : "";
  const requestedPath = searchParams.get("path")?.trim() ?? "";
  const targetPath =
    requestedPath.startsWith("/") && ALLOWED_TARGET_PATHS.has(requestedPath)
      ? requestedPath
      : DEFAULT_TARGET_PATH;
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setError(null);
    if (isLoggedIn !== true) {
      router.replace(targetPath);
      return;
    }
    if (isFriend === true) {
      router.replace(targetPath);
      return;
    }

    setChecking(true);
    try {
      const liff = (await import("@line/liff")).default;
      const friendship = await liff.getFriendship();
      if ((friendship as { friendFlag?: boolean }).friendFlag) {
        router.replace(targetPath);
        return;
      }
      setError(t("notAddedYet"));
    } catch {
      setError(t("friendCheckFailed"));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#F8FAFC]">
      <div className="flex flex-col items-center px-6 pb-10 pt-10 max-w-lg mx-auto">
        <div className="w-full rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-5">
          <div className="bg-gradient-to-br from-[#06C755] to-[#00B900] px-6 pt-7 pb-5 text-center">
            <div className="relative w-36 h-36 mx-auto mb-3">
              <Image
                src="/hero-add-friend.png"
                alt=""
                width={144}
                height={144}
                className="object-contain"
                priority
              />
            </div>
            <p className="text-sm font-semibold text-white/90">
              LINE OA Posting Gate
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white drop-shadow-sm leading-tight">
              {t("title")}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-white/90">
              {t("subtitle")}
            </p>
          </div>
          <div className="px-6 pb-6 pt-6">
            <p className="text-[#0F172A] text-center text-base leading-relaxed">
              {t("copy")}
            </p>
            <div className="mt-5 space-y-3">
              {[
                { icon: MessageCircle, label: t("benefitOne") },
                { icon: BellRing, label: t("benefitTwo") },
                { icon: ShieldCheck, label: t("benefitThree") },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="mt-0.5 rounded-full bg-[#06C755]/10 p-2 text-[#06C755]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{label}</p>
                </div>
              ))}
            </div>
            {isFriend === true && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                {t("alreadyFriend")}
              </div>
            )}
            {error && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            )}
          </div>
        </div>

        {addFriendUrl ? (
          <a
            href={addFriendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#06C755] text-white font-semibold text-lg shadow-lg hover:bg-[#05b34b] active:scale-[0.98] transition tap-target min-h-[56px]"
          >
            <UserPlus className="h-6 w-6 shrink-0" aria-hidden />
            {t("button")}
          </a>
        ) : (
          <p className="text-sm text-slate-500 text-center">{t("lineConfigMissing")}</p>
        )}
        <button
          type="button"
          onClick={handleContinue}
          disabled={!isReady || checking}
          className="mt-3 w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl border border-slate-200 bg-white text-[#0F172A] font-semibold text-base shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 tap-target min-h-[56px]"
        >
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
          {checking ? t("checking") : t("secondaryButton")}
        </button>
      </div>
    </div>
  );
}
