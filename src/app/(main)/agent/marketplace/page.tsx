"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Search,
  SlidersHorizontal,
  ImageIcon,
  ChevronRight,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useLiff } from "@/providers/LiffProvider";

type Property = {
  id: string;
  name: string;
  type: string;
  price: number;
  address: string;
  imageUrl?: string;
};

export default function AgentMarketplacePage() {
  const t = useTranslations("marketplace");
  const tAuth = useTranslations("auth");
  const tProps = useTranslations("properties");
  const { profile } = useLiff();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchProperties = useCallback(
    async (overrides?: {
      location?: string;
      minPrice?: string;
      maxPrice?: string;
    }) => {
      const loc = (overrides?.location ?? searchQuery).trim();
      const minStr = overrides?.minPrice ?? minPrice;
      const maxStr = overrides?.maxPrice ?? maxPrice;
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (!token) {
          setError(tAuth("pleaseLogin"));
          return;
        }
        const params = new URLSearchParams();
        if (loc) params.set("location", loc);
        const min = minStr.trim() ? Number(minStr) : undefined;
        const max = maxStr.trim() ? Number(maxStr) : undefined;
        if (min != null && !Number.isNaN(min)) params.set("minPrice", String(min));
        if (max != null && !Number.isNaN(max)) params.set("maxPrice", String(max));

        const res = await fetch(`/api/agent/marketplace?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401) {
            setError(tAuth("pleaseLogin"));
            return;
          }
          const data = await res.json().catch(() => ({}));
          setError(data.message ?? t("failedToLoad"));
          return;
        }
        const data = await res.json();
        const list = (data.properties ?? []).map(
          (p: {
            id: string;
            name: string;
            type: string;
            price: number;
            address: string;
            imageUrl?: string;
          }) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            price: p.price,
            address: p.address,
            imageUrl: p.imageUrl,
          })
        );
        setProperties(list);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("failedToLoad"));
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, minPrice, maxPrice, t, tAuth]
  );

  useEffect(() => {
    setLoading(true);
    fetchProperties();
  }, []);

  const applyFilters = () => {
    setSearchQuery(locationFilter);
    setFilterOpen(false);
    setLoading(true);
    fetchProperties({
      location: locationFilter,
      minPrice,
      maxPrice,
    });
  };

  const clearFilters = () => {
    setLocationFilter("");
    setMinPrice("");
    setMaxPrice("");
    setSearchQuery("");
    setFilterOpen(false);
    setLoading(true);
    fetchProperties({ location: "", minPrice: "", maxPrice: "" });
  };

  const handleSearchSubmit = () => {
    setLoading(true);
    fetchProperties({ location: searchQuery, minPrice, maxPrice });
  };

  const hasActiveFilters =
    locationFilter.trim() !== "" ||
    minPrice.trim() !== "" ||
    maxPrice.trim() !== "";

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-24">
      <header className="mb-4 rounded-2xl bg-gradient-to-br from-[#0F172A] to-teal-600 p-5 text-white shadow-lg overflow-hidden">
        <p className="text-sm text-white/80 mb-1">
          {t("welcome")}
          {profile?.displayName ? `, ${profile.displayName}` : ""}
        </p>
        <h1 className="text-xl font-bold tracking-tight">{t("title")}</h1>
      </header>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[#0F172A] placeholder:text-slate-400 focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 text-sm"
            aria-label={t("searchPlaceholder")}
          />
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen((o) => !o)}
          className={`flex items-center justify-center rounded-xl border-2 px-4 py-2.5 tap-target transition-colors ${
            hasActiveFilters
              ? "border-[#10B981] bg-[#10B981]/10 text-[#10B981]"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
          aria-label={t("filterByLocationPrice")}
          aria-expanded={filterOpen}
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {filterOpen && (
        <div className="mb-4 p-4 rounded-xl border border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              {t("filterByLocationPrice")}
            </h2>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 tap-target"
              aria-label={t("closeFilters")}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t("location")}
            </label>
            <input
              type="text"
              placeholder={t("locationPlaceholder")}
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t("minPrice")}
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t("maxPrice")}
              </label>
              <input
                type="number"
                min={0}
                placeholder={t("noLimit")}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 tap-target"
            >
              {t("clearFilters")}
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="flex-1 py-2.5 rounded-lg bg-[#10B981] text-white text-sm font-medium hover:bg-[#0D9668] tap-target"
            >
              {t("applyFilters")}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <div
          className="space-y-4 mb-4"
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

      {!loading && (
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
                  <span className="absolute top-2 right-2">
                    <Badge
                      variant="success"
                      className="bg-[#10B981]/90 text-white border-[#10B981]"
                    >
                      {t("commissionBadge")}
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
                      {t("viewDetails")}
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!loading && properties.length === 0 && !error && (
        <p className="text-slate-500 text-sm text-center py-8">{t("noListings")}</p>
      )}
    </div>
  );
}
