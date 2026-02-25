"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";

const ADD_FRIEND_URL_BASE = "https://line.me/R/ti/p/";

export default function AddFriendRequiredPage() {
  const t = useTranslations("addFriendRequired");
  const lineOfficialId = process.env.NEXT_PUBLIC_LINE_OFFICIAL_ID ?? "";
  const addFriendUrl = lineOfficialId
    ? `${ADD_FRIEND_URL_BASE}${lineOfficialId}`
    : "";

  return (
    <div className="min-h-dvh bg-[#F8FAFC]">
      <div className="flex flex-col items-center pt-12 px-6 pb-6 max-w-lg mx-auto">
        <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-5">
          <div className="bg-gradient-to-br from-[#06C755] to-[#00B900] px-6 pt-6 pb-4 text-center">
            <div className="relative w-40 h-40 mx-auto mb-4">
              <Image
                src="/hero-add-friend.png"
                alt=""
                width={160}
                height={160}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-bold text-white drop-shadow-sm">
              {t("title")}
            </h1>
          </div>
          <div className="px-6 py-6">
            <p className="text-[#0F172A] text-center text-base leading-relaxed">
              {t("copy")}
            </p>
          </div>
        </div>

        {addFriendUrl ? (
          <a
            href={addFriendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-[#06C755] text-white font-semibold text-lg shadow-lg hover:bg-[#05b34b] active:scale-[0.98] transition tap-target min-h-[56px]"
          >
            <UserPlus className="h-6 w-6 shrink-0" aria-hidden />
            {t("button")}
          </a>
        ) : (
          <p className="text-sm text-slate-500 text-center">
            NEXT_PUBLIC_LINE_OFFICIAL_ID is not set. Set it to show the add friend link.
          </p>
        )}
      </div>
    </div>
  );
}
