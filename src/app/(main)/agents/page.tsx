"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Store, ChevronRight, ImageIcon, Settings } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type Property = {
  id: string;
  name: string;
  type: string;
  status?: string;
  price: number;
  address: string;
  imageUrl?: string;
};

export default function AgentsPage() {
  const t = useTranslations("agentWork");
  const tAuth = useTranslations("auth");
  const tProps = useTranslations("properties");
  const tSettings = useTranslations("settings");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        setError(tAuth("pleaseLogin"));
        setLoading(false);
        return;
      }
      const res = await fetch("/api/agent/properties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError(tAuth("pleaseLogin"));
          setLoading(false);
          return;
        }
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? t("error"));
        setProperties([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const list = (data.properties ?? []).map(
        (p: {
          id: string;
          name: string;
          type: string;
          status?: string;
          price: number;
          address: string;
          imageUrl?: string;
        }) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          status: p.status,
          price: p.price,
          address: p.address,
          imageUrl: p.imageUrl,
        })
      );
      setProperties(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [t, tAuth]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-24">
      <div className="flex justify-end mb-2">
        <Link
          href="/agent/settings"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 tap-target min-h-[44px]"
          aria-label={tSettings("title")}
        >
          <Settings className="h-5 w-5" aria-hidden />
          <span className="text-sm font-medium">{tSettings("title")}</span>
        </Link>
      </div>
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
          {t("title")}
        </h1>
      </header>

      {loading && (
        <div
          className="space-y-4"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="h-5 w-5 shrink-0 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin"
              aria-hidden
            />
            <p className="text-slate-600 text-sm">{t("loading")}</p>
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="aspect-[4/3] bg-slate-200 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
                <div className="flex items-center justify-between mt-3">
                  <div className="h-5 w-24 rounded bg-slate-200 animate-pulse" />
                  <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="mb-4 p-4 rounded-xl border border-red-200 bg-red-50">
          <p className="text-red-700 text-sm mb-3" role="alert">
            {error}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchProperties}
              className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 tap-target"
            >
              {t("retry")}
            </button>
            <Link
              href="/agent/marketplace"
              className="rounded-lg bg-[#10B981] px-3 py-2 text-sm font-medium text-white hover:bg-[#0D9668] tap-target"
            >
              {t("browseMarketplace")}
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && properties.length === 0 && (
        <div className="rounded-xl border-2 border-slate-200 bg-white p-6 text-center">
          <p className="font-semibold text-[#0F172A] mb-1">{t("emptyTitle")}</p>
          <p className="text-slate-600 text-sm mb-4">{t("emptyMessage")}</p>
          <Link
            href="/agent/marketplace"
            className="inline-flex items-center justify-center gap-2 w-full max-w-xs mx-auto py-3 px-4 rounded-xl bg-[#10B981] text-white font-medium hover:bg-[#0D9668] tap-target"
          >
            <Store className="h-5 w-5 shrink-0" aria-hidden />
            {t("browseMarketplace")}
          </Link>
        </div>
      )}

      {!loading && !error && properties.length > 0 && (
        <>
          <ul className="space-y-4">
            {properties.map((property) => (
              <li key={property.id}>
                <Link
                  href={`/agent/property/${property.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-[#10B981]/30 transition-all"
                >
                  <div className="relative aspect-[4/3] bg-slate-200">
                    {property.imageUrl ? (
                      <img
                        src={property.imageUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <ImageIcon className="h-12 w-12" aria-hidden />
                      </div>
                    )}
                    {property.status && (
                      <div className="absolute inset-x-2 top-2">
                        <Badge
                          variant={
                            property.status === "Available"
                              ? "success"
                              : property.status === "Occupied"
                                ? "warning"
                                : "default"
                          }
                          className={
                            property.status === "Available"
                              ? "bg-emerald-500/90 text-white border-emerald-600"
                              : property.status === "Occupied"
                                ? "bg-amber-500/90 text-white border-amber-600"
                                : "bg-slate-500/90 text-white border-slate-600"
                          }
                        >
                          {tProps(`status.${property.status}`)}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold text-[#0F172A] text-base">
                      {property.name}
                    </h2>
                    <p className="text-slate-500 text-sm mt-0.5 truncate">
                      {property.address}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-semibold text-[#0F172A]">
                        ฿{property.price.toLocaleString()} {tProps("perMonth")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-[#10B981] font-medium">
                        {t("viewDetails")}
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <Link
              href="/agent/marketplace"
              className="flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-[#10B981]/30 bg-[#10B981]/5 hover:bg-[#10B981]/10 transition-colors tap-target"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/20 text-[#10B981]">
                  <Store className="h-6 w-6" aria-hidden />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#0F172A]">
                    {t("browseMarketplace")}
                  </p>
                  <p className="text-sm text-slate-600">
                    {t("emptyMessage")}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[#10B981] shrink-0" aria-hidden />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
