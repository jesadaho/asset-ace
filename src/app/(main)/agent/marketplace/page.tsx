"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  status?: string;
  price: number;
  address: string;
  openForAgent?: boolean;
  imageUrl?: string;
};

export default function AgentMarketplacePage() {
  const t = useTranslations("marketplace");
  const tAuth = useTranslations("auth");
  const tProps = useTranslations("properties");
  const { profile } = useLiff();
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [openForAgentOnly, setOpenForAgentOnly] = useState(false);

  const PAGE_SIZE = 10;

  const fetchProperties = useCallback(
    async (opts?: {
      location?: string;
      minPrice?: string;
      maxPrice?: string;
      openForAgent?: boolean;
      cursor?: string;
      append?: boolean;
    }) => {
      const loc = (opts?.location ?? searchQuery).trim();
      const minStr = opts?.minPrice ?? minPrice;
      const maxStr = opts?.maxPrice ?? maxPrice;
      const openForAgent = opts?.openForAgent ?? openForAgentOnly;
      const cursor = opts?.cursor;
      const append = opts?.append ?? false;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (!token) {
          setError(tAuth("pleaseLogin"));
          return;
        }
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        params.set("openForAgent", openForAgent ? "true" : "false");
        if (loc) params.set("location", loc);
        const min = minStr.trim() ? Number(minStr) : undefined;
        const max = maxStr.trim() ? Number(maxStr) : undefined;
        if (min != null && !Number.isNaN(min)) params.set("minPrice", String(min));
        if (max != null && !Number.isNaN(max)) params.set("maxPrice", String(max));
        if (cursor) params.set("cursor", cursor);

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
            status?: string;
            price: number;
            address: string;
            openForAgent?: boolean;
            imageUrl?: string;
          }) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            status: p.status,
            price: p.price,
            address: p.address,
            openForAgent: p.openForAgent,
            imageUrl: p.imageUrl,
          })
        );
        if (append) {
          setProperties((prev) => [...prev, ...list]);
        } else {
          setProperties(list);
        }
        if (data.totalCount !== undefined) setTotalCount(data.totalCount);
        setHasMore(!!data.hasMore);
        setNextCursor(data.nextCursor ?? undefined);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("failedToLoad"));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, minPrice, maxPrice, openForAgentOnly, t, tAuth]
  );

  useEffect(() => {
    fetchProperties();
  }, []);

  const searchRowRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // #region agent log
    if (searchRowRef.current && !loading) {
      const el = searchRowRef.current;
      const input = el.querySelector('input[type="search"]');
      const inputBg = input && typeof window !== "undefined" ? window.getComputedStyle(input as Element).backgroundColor : "";
      fetch("http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d6e810" },
        body: JSON.stringify({
          sessionId: "d6e810",
          hypothesisId: "H2",
          location: "agent/marketplace/page.tsx:searchRow",
          message: "Marketplace search row",
          data: { searchInputComputedBg: inputBg },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
  }, [loading]);

  const applyFilters = () => {
    setSearchQuery(locationFilter);
    setFilterOpen(false);
    fetchProperties({
      location: locationFilter,
      minPrice,
      maxPrice,
      openForAgent: openForAgentOnly,
      append: false,
    });
  };

  const clearFilters = () => {
    setLocationFilter("");
    setMinPrice("");
    setMaxPrice("");
    setSearchQuery("");
    setOpenForAgentOnly(false);
    setFilterOpen(false);
    fetchProperties({
      location: "",
      minPrice: "",
      maxPrice: "",
      openForAgent: false,
      append: false,
    });
  };

  const handleSearchSubmit = () => {
    fetchProperties({
      location: searchQuery,
      minPrice,
      maxPrice,
      openForAgent: openForAgentOnly,
      append: false,
    });
  };

  const loadMore = () => {
    if (!nextCursor || loadingMore) return;
    fetchProperties({
      location: searchQuery.trim(),
      minPrice,
      maxPrice,
      openForAgent: openForAgentOnly,
      cursor: nextCursor,
      append: true,
    });
  };

  const hasActiveFilters =
    locationFilter.trim() !== "" ||
    minPrice.trim() !== "" ||
    maxPrice.trim() !== "" ||
    !openForAgentOnly;

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-24">
      <header className="mb-4 rounded-2xl bg-gradient-to-br from-[#0F172A] to-teal-600 p-5 text-white shadow-lg overflow-hidden">
        <p className="text-sm text-white/80 mb-1">
          {t("welcome")}
          {profile?.displayName ? `, ${profile.displayName}` : ""}
        </p>
        <h1 className="text-xl font-bold tracking-tight">{t("title")}</h1>
      </header>

      <div ref={searchRowRef} className="flex gap-2 mb-4">
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
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="shrink-0 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 tap-target"
            aria-label={t("showAll")}
          >
            {t("showAll")}
          </button>
        )}
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
          <div className="flex items-center justify-between gap-3 py-1">
            <span className="text-sm text-slate-700">
              {t("openForAgentOnly")}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={openForAgentOnly}
              onClick={() => {
                setOpenForAgentOnly((v) => !v);
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 transition-colors tap-target focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:ring-offset-2 ${
                openForAgentOnly
                  ? "border-[#10B981] bg-[#10B981]"
                  : "border-slate-300 bg-slate-200"
              }`}
              aria-label={t("openForAgentOnly")}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  openForAgentOnly ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
                style={{ marginTop: 2 }}
                aria-hidden
              />
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
              className="bg-emerald-50/80 rounded-xl shadow-sm border border-slate-200 overflow-hidden"
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

      {!loading && properties.length > 0 && (
        <p className="text-slate-500 text-sm mb-3" aria-live="polite">
          {totalCount !== undefined
            ? t("showingPropertiesOf", {
                count: properties.length,
                total: totalCount,
              })
            : t("showingProperties", { count: properties.length })}
        </p>
      )}

      {!loading && (
        <ul className="space-y-4">
          {properties.map((property) => (
            <li key={property.id}>
              <Link
                href={`/agent/property/${property.id}`}
                className="block bg-emerald-50/80 rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-[#10B981]/30 transition-all"
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
                  <div className="absolute inset-x-2 top-2 flex flex-wrap items-start justify-between gap-2">
                    {property.status && (
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
                    )}
                    <span className="flex flex-wrap gap-1.5">
                      {property.status === "Available" && (openForAgentOnly || property.openForAgent) && (
                        <Badge
                          variant="success"
                          className="bg-[#10B981]/90 text-white border-[#10B981]"
                        >
                          {t("openForAgentBadge")}
                        </Badge>
                      )}
                      {property.status === "Available" && !property.openForAgent && (
                        <Badge
                          variant="default"
                          className="bg-slate-500/90 text-white border-slate-600"
                        >
                          {t("ownerManagedBadge")}
                        </Badge>
                      )}
                      <Badge
                        variant="success"
                        className="bg-[#10B981]/90 text-white border-[#10B981]"
                      >
                        {t("commissionBadge")}
                      </Badge>
                    </span>
                  </div>
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

      {!loading && hasMore && properties.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-xl border-2 border-[#10B981] bg-white px-6 py-3 text-sm font-medium text-[#10B981] hover:bg-[#10B981]/5 disabled:opacity-50 tap-target"
          >
            {loadingMore ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-4 w-4 shrink-0 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin"
                  aria-hidden
                />
                {t("loading")}
              </span>
            ) : (
              t("loadMore")
            )}
          </button>
        </div>
      )}

      {!loading && properties.length === 0 && !error && (
        <p className="text-slate-500 text-sm text-center py-8">{t("noListings")}</p>
      )}
    </div>
  );
}
