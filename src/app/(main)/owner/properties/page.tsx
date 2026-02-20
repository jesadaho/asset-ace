"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search, ChevronRight, Plus, ImageIcon, Eye, EyeOff, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useLiff } from "@/providers/LiffProvider";

type PropertyType = "Condo" | "House" | "Apartment";
type PropertyStatus = "Available" | "Occupied" | "Maintenance";

type Property = {
  id: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  address: string;
  image?: string;
  agentName?: string;
  agentLineId?: string;
};

const statusBadgeVariant: Record<
  PropertyStatus,
  "success" | "error" | "warning"
> = {
  Available: "success",
  Occupied: "error",
  Maintenance: "warning",
};

type StatusFilter = "All" | PropertyStatus;
type SummaryFilter = "all" | "available" | "pending";

export default function OwnerPropertiesPage() {
  const t = useTranslations("dashboard");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tProps = useTranslations("properties");
  const { profile } = useLiff();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>("all");
  const [isAmountVisible, setIsAmountVisible] = useState(true);
  const [isDashboardVisible, setIsDashboardVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchProperties() {
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (!token) {
          if (!cancelled) setError(tAuth("pleaseLogin"));
          return;
        }
        const res = await fetch("/api/owner/properties", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 401) {
            setError(tAuth("pleaseLogin"));
            return;
          }
          const data = await res.json().catch(() => ({}));
          setError(data.message ?? t("failedToLoadProperties"));
          return;
        }
        const data = await res.json();
        const list = (data.properties ?? []).map((p: { id: string; name: string; type: string; status: string; price: number; address: string; imageUrl?: string; agentName?: string; agentLineId?: string }) => ({
          id: p.id,
          name: p.name,
          type: p.type as PropertyType,
          status: p.status as PropertyStatus,
          price: p.price,
          address: p.address,
          image: p.imageUrl,
          agentName: p.agentName,
          agentLineId: p.agentLineId,
        }));
        setProperties(list);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("failedToLoadProperties"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProperties();
    return () => { cancelled = true; };
  }, []);

  const { totalMonthlyIncome, potentialIncome, total, available, pending } = useMemo(() => {
    const totalMonthlyIncome = properties
      .filter((p) => p.status === "Occupied")
      .reduce((sum, p) => sum + (p.price ?? 0), 0);
    const potentialIncome = properties.reduce((sum, p) => sum + (p.price ?? 0), 0);
    const total = properties.length;
    const available = properties.filter((p) => p.status === "Available").length;
    const pending = properties.filter((p) => !(p.agentName || p.agentLineId)).length;
    return { totalMonthlyIncome, potentialIncome, total, available, pending };
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return properties.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "All" || p.status === statusFilter;
      const matchesSummary =
        summaryFilter === "all" ||
        (summaryFilter === "available" && p.status === "Available") ||
        (summaryFilter === "pending" && !(p.agentName || p.agentLineId));
      return matchesSearch && matchesStatus && matchesSummary;
    });
  }, [properties, searchQuery, statusFilter, summaryFilter]);

  const counts = useMemo(() => {
    const occupied = properties.filter((p) => p.status === "Occupied").length;
    const maintenance = properties.filter(
      (p) => p.status === "Maintenance"
    ).length;
    return { total, occupied: occupied, available, maintenance };
  }, [properties, total, available]);

  const handleSearchFocus = () => setIsDashboardVisible(false);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) setIsDashboardVisible(false);
  };
  const handleFilterClick = (option: StatusFilter) => {
    setStatusFilter(option);
    setIsDashboardVisible(false);
  };

  return (
    <div className="min-h-full bg-slate-50 p-4">
      {isDashboardVisible && (
        <>
          <div className="mb-4 rounded-2xl bg-gradient-to-br from-[#0F172A] to-teal-600 p-5 text-white shadow-lg overflow-hidden transition-all duration-300">
            <p className="text-sm text-white/80 mb-1">
              {t("welcome")}{profile?.displayName ? `, ${profile.displayName}` : ""}
            </p>
            <p className="text-xs text-white/70 mb-3">{t("totalMonthlyIncome")}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight">
                {isAmountVisible
                  ? `฿${totalMonthlyIncome.toLocaleString()}`
                  : "฿ ——"}
              </span>
              <button
                type="button"
                onClick={() => setIsAmountVisible((v) => !v)}
                className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 tap-target"
                aria-label={isAmountVisible ? "Hide amount" : "Show amount"}
              >
                {isAmountVisible ? (
                  <Eye className="h-5 w-5" aria-hidden />
                ) : (
                  <EyeOff className="h-5 w-5" aria-hidden />
                )}
              </button>
            </div>
            <p className="text-sm text-white/70 mt-2">
              {t("potentialIncome")}: ฿{potentialIncome.toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSummaryFilter("all")}
              className={`rounded-xl border-2 p-4 text-center transition-colors tap-target ${
                summaryFilter === "all"
                  ? "border-[#0F172A] bg-slate-100"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="block text-xl font-bold text-[#0F172A]">{total}</span>
              <span className="block text-xs text-slate-600 mt-0.5">{t("total")}</span>
            </button>
            <button
              type="button"
              onClick={() => setSummaryFilter("available")}
              className={`rounded-xl border-2 p-4 text-center transition-colors tap-target ${
                summaryFilter === "available"
                  ? "border-[#10B981] bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="block text-xl font-bold text-[#0D9668]">{available}</span>
              <span className="block text-xs text-slate-600 mt-0.5">{t("available")}</span>
            </button>
            <button
              type="button"
              onClick={() => setSummaryFilter("pending")}
              className={`rounded-xl border-2 p-4 text-center transition-colors tap-target ${
                summaryFilter === "pending"
                  ? "border-amber-500 bg-amber-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="block text-xl font-bold text-amber-600">{pending}</span>
              <span className="block text-xs text-slate-600 mt-0.5">{t("pending")}</span>
            </button>
          </div>
        </>
      )}

      {!isDashboardVisible && (
        <button
          type="button"
          onClick={() => setIsDashboardVisible(true)}
          className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 tap-target w-full justify-center"
        >
          <LayoutDashboard className="h-4 w-4" aria-hidden />
          {t("showSummary")}
        </button>
      )}

      <h1 className="text-2xl font-bold text-[#0F172A] mb-4">
        {tProps("myProperties")}
      </h1>

      {error && (
        <p className="text-red-500 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <div className="space-y-4 mb-4 pb-24" aria-busy="true" aria-live="polite">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 shrink-0 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" aria-hidden />
            <p className="text-slate-600 text-sm">{t("loadingProperties")}</p>
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

      {!loading && (
      <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="default">{tProps("total")}: {counts.total}</Badge>
        <Badge variant="error">{tProps("occupied")}: {counts.occupied}</Badge>
        <Badge variant="success">{tProps("available")}: {counts.available}</Badge>
        {counts.maintenance > 0 && (
          <Badge variant="warning">{tProps("maintenance")}: {counts.maintenance}</Badge>
        )}
      </div>

      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          placeholder={tProps("searchPlaceholder")}
          value={searchQuery}
          onFocus={handleSearchFocus}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[#0F172A] placeholder:text-slate-400 focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 text-sm"
          aria-label="Search properties"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(["All", "Occupied", "Available", "Maintenance"] as const).map(
          (option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleFilterClick(option)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === option
                  ? "bg-[#0F172A] text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {option === "All" ? tProps("all") : tProps(option.toLowerCase() as "occupied" | "available" | "maintenance")}
            </button>
          )
        )}
      </div>

      <ul className="space-y-4 pb-24">
        {!loading &&
          filteredProperties.map((property) => (
            <li key={property.id}>
              <Link
                href={`/owner/properties/${property.id}`}
                className="block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[4/3] bg-slate-200">
                  {property.image ? (
                    <img
                      src={property.image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    <ImageIcon className="h-12 w-12" aria-hidden />
                  </div>
                )}
                <span className="absolute top-2 right-2">
                  <Badge variant={statusBadgeVariant[property.status]}>
                    {tProps(`status.${property.status}`)}
                  </Badge>
                </span>
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
                    {tCommon("viewDetails")}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {!loading && filteredProperties.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-8 pb-24">
          {properties.length === 0
            ? t("noPropertiesYet")
            : tProps("noMatch")}
        </p>
      )}
      </>
      )}

      <Link
        href="/owner/properties/add"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#10B981] text-white shadow-lg hover:bg-[#0D9668] active:bg-[#0B7A56] transition-colors tap-target"
        aria-label={tCommon("addProperty")}
      >
        <Plus className="h-7 w-7" aria-hidden />
      </Link>
    </div>
  );
}
