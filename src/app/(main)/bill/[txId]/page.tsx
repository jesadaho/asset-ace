"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLiff } from "@/providers/LiffProvider";

const TEAL = "#55BEB0";

/** safe-area + minimum top padding (avoid globals .safe-area-top overriding Tailwind pt-*) */
const HEADER_PAD_TOP =
  "pt-[max(2.25rem,env(safe-area-inset-top,0px))]";

type BillPayload = {
  propertyName: string;
  amount: number;
  status: string;
  slipDate?: string;
  periodKey: string;
  cycleLabel: string | null;
  fromName?: string;
  toName?: string;
  payerBankId?: string;
  payerBankName?: string;
  payerBankShort?: string;
  payerBankLogoUrl?: string | null;
  receiverAccountName?: string;
  receiverBankName?: string;
  receiverBankCode?: string;
  receiverAccountNumber?: string;
  /** Always set: bank from owner settings, slip, or default asset */
  receiverBankLogoUrl: string;
};

function CycleLine({ text }: { text: string }) {
  const m = text.match(/^(รอบวันที่ )(.+?)( \(เก็บทุกเดือน\))$/);
  if (!m) return <>{text}</>;
  return (
    <>
      {m[1]}
      <span className="border-b-2 border-emerald-600 font-medium">{m[2]}</span>
      {m[3]}
    </>
  );
}

function shimmerClass(lightOnTeal?: boolean): string {
  return lightOnTeal
    ? "animate-pulse rounded-md bg-white/25"
    : "animate-pulse rounded-md bg-slate-200/90";
}

function BillPageSkeleton({ showBackButton }: { showBackButton: boolean }) {
  return (
    <div
      className="min-h-dvh bg-[#F0F4F4] pb-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">กำลังโหลดบิล</span>
      <div
        className={`px-5 pb-8 ${HEADER_PAD_TOP}`}
        style={{ backgroundColor: TEAL }}
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            {showBackButton ? (
              <div
                className={`mb-3 h-5 w-16 ${shimmerClass(true)}`}
                aria-hidden
              />
            ) : (
              <div className="mb-3 h-5" aria-hidden />
            )}
            <div
              className={`h-6 max-w-[min(72%,14rem)] ${shimmerClass(true)}`}
              aria-hidden
            />
            <div
              className={`mt-3 h-10 w-36 ${shimmerClass(true)}`}
              aria-hidden
            />
          </div>
          <div
            className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-white/20 animate-pulse"
            aria-hidden
          />
        </div>
      </div>

      <div className="-mt-2 bg-[#F0F4F4] px-4">
        <div className="rounded-b-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100/80">
          <div className={`h-4 max-w-[12rem] ${shimmerClass()}`} aria-hidden />
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className={`mb-3 h-4 w-28 ${shimmerClass()}`} aria-hidden />
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 shrink-0 rounded-full bg-slate-200/90 animate-pulse"
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-2">
              <div className={`h-4 max-w-[9rem] ${shimmerClass()}`} aria-hidden />
              <div className={`h-3 max-w-[6rem] ${shimmerClass()}`} aria-hidden />
            </div>
            <div className={`h-7 w-20 shrink-0 ${shimmerClass()}`} aria-hidden />
          </div>
        </div>

        <div>
          <div className={`mb-2 h-4 w-32 ${shimmerClass()}`} aria-hidden />
          <div className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div
              className="h-11 w-11 shrink-0 rounded-xl bg-slate-200/90 animate-pulse"
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <div className={`h-4 max-w-[11rem] ${shimmerClass()}`} aria-hidden />
              <div className={`h-3 max-w-full ${shimmerClass()}`} aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillPage() {
  const params = useParams();
  const router = useRouter();
  const { isInClient, isReady } = useLiff();
  /** เปิดจาก Flex/LIFF ใน LINE ไม่โชว์ปุ่มกลับ */
  const showBackButton = isReady && !isInClient;
  const txId = typeof params.txId === "string" ? params.txId : "";
  const [data, setData] = useState<BillPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!txId) {
      setError("ไม่พบรหัสบิล");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (!token) {
          if (!cancelled) setError("กรุณาเปิดจาก LINE");
          return;
        }
        const res = await fetch(`/api/bill/${txId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          if (res.status === 401) setError("กรุณาเข้าสู่ระบบ");
          else if (res.status === 403) setError("คุณไม่มีสิทธิ์ดูบิลนี้");
          else if (!res.ok) setError("โหลดบิลไม่สำเร็จ");
          else setData((await res.json()) as BillPayload);
        }
      } catch {
        if (!cancelled) setError("เกิดข้อผิดพลาด");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [txId]);

  const formatMoney = (n: number) =>
    n.toLocaleString("th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  if (loading) {
    return <BillPageSkeleton showBackButton={showBackButton} />;
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh flex flex-col bg-[#F8FAFC] px-4 py-6">
        {showBackButton ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-sm text-slate-600 tap-target"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </button>
        ) : null}
        <p className="text-center text-slate-700">{error ?? "ไม่พบข้อมูล"}</p>
      </div>
    );
  }

  const slipD = data.slipDate ? new Date(data.slipDate) : null;
  const slipLabel =
    slipD && !Number.isNaN(slipD.getTime())
      ? slipD.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  const showReceiver =
    data.receiverAccountName ||
    data.receiverBankName ||
    data.receiverAccountNumber ||
    data.toName;

  return (
    <div className="min-h-dvh bg-[#F0F4F4] pb-8">
      <div
        className={`px-5 pb-8 text-white ${HEADER_PAD_TOP}`}
        style={{ backgroundColor: TEAL }}
      >
        <div className="flex gap-4 items-start">
          <div className="min-w-0 flex-1">
            {showBackButton ? (
              <button
                type="button"
                onClick={() => router.back()}
                className="mb-3 flex items-center gap-2 text-sm text-white/90 tap-target -ml-1"
              >
                <ArrowLeft className="h-5 w-5" />
                กลับ
              </button>
            ) : null}
            <h1 className="text-lg font-medium leading-snug">
              {data.propertyName}
            </h1>
            <p className="mt-3 text-3xl font-bold tracking-tight">
              ฿ {formatMoney(data.amount)}
            </p>
          </div>
          <div
            className="flex h-[72px] w-[72px] shrink-0 items-center justify-center select-none"
            aria-hidden
          >
            <span className="text-[2.75rem] leading-none drop-shadow-sm">📆</span>
          </div>
        </div>
      </div>

      {data.cycleLabel ? (
        <div className="-mt-2 px-4 bg-[#F0F4F4]">
          <div className="rounded-b-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            <CycleLine text={data.cycleLabel} />
          </div>
        </div>
      ) : null}

      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm font-medium text-slate-800">จ่ายแล้ว! 🎉</p>
          <div className="mt-3 flex items-center gap-3">
            {data.payerBankLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local SVG from API
              <img
                src={data.payerBankLogoUrl}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-slate-100"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                {(data.fromName ?? "?").slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 truncate">
                {data.fromName ?? "ผู้จ่าย"}
              </p>
              {data.payerBankShort || data.payerBankName ? (
                <p className="text-xs font-medium text-slate-600 truncate">
                  <span className="text-slate-500">โอนผ่าน </span>
                  {data.payerBankShort ?? data.payerBankName}
                </p>
              ) : null}
              {slipLabel ? (
                <p className="text-xs text-slate-500">วันที่สลิป {slipLabel}</p>
              ) : null}
            </div>
            <p className="text-lg font-bold text-emerald-600 shrink-0">
              ฿ {formatMoney(data.amount)}
            </p>
          </div>
        </div>

        {showReceiver ? (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-600">
              บัญชีรับเงิน (ปลายทาง)
            </p>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- local SVG from API */}
                <img
                  src={data.receiverBankLogoUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-xl bg-[#d8eeea] object-contain p-1 shadow-sm ring-1 ring-slate-100"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {data.receiverAccountName ?? data.toName ?? "—"}
                  </p>
                  {(data.receiverBankName || data.receiverAccountNumber) && (
                    <p className="mt-1 text-sm text-slate-600">
                      {[data.receiverBankName, data.receiverAccountNumber]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
