"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ImageIcon, Pencil, MessageCircle, Copy, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type PropertyType = "Condo" | "House" | "Apartment";
type PropertyStatus = "Available" | "Occupied" | "Maintenance";

const statusBadgeVariant: Record<
  PropertyStatus,
  "success" | "error" | "warning"
> = {
  Available: "success",
  Occupied: "error",
  Maintenance: "warning",
};

type PropertyDetail = {
  id: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  address: string;
  imageUrl?: string;
  imageUrls?: string[];
  imageKeys?: string[];
  listingType?: string;
  bedrooms?: string;
  bathrooms?: string;
  addressPrivate?: boolean;
  description?: string;
  squareMeters?: string;
  amenities?: string[];
  tenantName?: string;
  tenantLineId?: string;
  agentName?: string;
  agentLineId?: string;
  lineGroup?: string;
  contractStartDate?: string;
  createdAt?: string;
};

export default function PropertyDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const t = useTranslations("propertyDetail");
  const tAuth = useTranslations("auth");
  const tProps = useTranslations("properties");
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el || el.offsetWidth <= 0) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    setPhotoIndex(Math.min(index, (el.children.length ?? 1) - 1));
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError(t("invalidProperty"));
      return;
    }
    let cancelled = false;
    async function fetchProperty() {
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (!token) {
          if (!cancelled) setError(tAuth("pleaseLogin"));
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/owner/properties/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.status === 401) {
          setError(tAuth("pleaseLogin"));
          setLoading(false);
          return;
        }
        if (res.status === 404) {
          setError(t("notFound"));
          setLoading(false);
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.message ?? t("failedToLoad"));
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProperty(data.property ?? null);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("failedToLoad"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProperty();
    return () => {
      cancelled = true;
    };
  }, [id, t, tAuth]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white safe-area-top pt-4">
        <div className="flex max-w-lg mx-auto items-center gap-2 px-4 py-3">
          <Link
            href="/owner/properties"
            className="shrink-0 flex items-center justify-center p-2 -m-2 text-[#0F172A] hover:text-[#003366] tap-target min-h-[44px] min-w-[44px]"
            aria-label={t("backToProperties")}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="min-w-0 flex-1 text-lg font-semibold text-[#0F172A] text-center truncate">
            {property?.name ?? t("title")}
          </h1>
          {property && (
            <Link
              href={`/owner/properties/${id}/edit`}
              className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[#10B981] font-medium hover:bg-[#10B981]/10 tap-target min-h-[44px]"
              aria-label={t("editAria")}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              <span className="text-sm">{t("edit")}</span>
            </Link>
          )}
          {!property && !loading && <span className="w-14" aria-hidden />}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {loading && (
          <div
            className="space-y-6"
            aria-busy="true"
            aria-live="polite"
          >
            <span className="sr-only">{t("loading")}</span>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="aspect-[4/3] bg-slate-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-6 w-3/4 rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
                <div className="h-5 w-1/3 rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
              </div>
            </div>
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="h-4 w-24 rounded bg-slate-200 animate-pulse mb-3" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
                <div className="flex flex-wrap gap-3">
                  <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
                  <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
                  <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
                </div>
              </div>
            </section>
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="h-4 w-28 rounded bg-slate-200 animate-pulse mb-3" />
              <div className="flex flex-wrap gap-2">
                <div className="h-6 w-16 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-6 w-20 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-6 w-14 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-6 w-20 rounded-full bg-slate-200 animate-pulse" />
              </div>
            </section>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm" role="alert">
            {error}
          </p>
        )}

        {!loading && property && (() => {
          const urls =
            property.imageUrls?.length
              ? property.imageUrls
              : property.imageUrl
                ? [property.imageUrl]
                : [];
          return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div
                className="relative aspect-[4/3] bg-slate-200"
                role="region"
                aria-label={t("photosAria")}
              >
                {urls.length > 0 ? (
                  <>
                    <div
                      ref={carouselRef}
                      onScroll={handleCarouselScroll}
                      className="flex h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
                      style={{ WebkitOverflowScrolling: "touch" }}
                    >
                      {urls.map((url, i) => (
                        <div
                          key={i}
                          className="min-w-full w-full flex-shrink-0 snap-center h-full bg-slate-200"
                        >
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    {urls.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                        {urls.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              carouselRef.current?.scrollTo({
                                left: i * (carouselRef.current?.offsetWidth ?? 0),
                                behavior: "smooth",
                              });
                            }}
                            className={`h-2 rounded-full transition-colors ${
                              i === photoIndex
                                ? "w-4 bg-white"
                                : "w-2 bg-white/60 hover:bg-white/80"
                            }`}
                            aria-label={t("photoOf", { current: i + 1, total: urls.length })}
                            aria-current={i === photoIndex ? true : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </>
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
              <div className="p-4 space-y-3">
                <h2 className="text-xl font-bold text-[#0F172A]">
                  {property.name}
                </h2>
                <p className="text-slate-600 text-sm">{property.type}</p>
                <p className="font-semibold text-[#0F172A]">
                  ฿{property.price.toLocaleString()} {tProps("perMonth")}
                </p>
                <p className="text-slate-600 text-sm">{property.address}</p>
              </div>
            </div>

            {(property.description ?? property.bedrooms ?? property.bathrooms ?? property.squareMeters) && (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
                  {t("details")}
                </h3>
                <div className="space-y-2 text-sm text-slate-600">
                  {property.description && (
                    <p className="whitespace-pre-wrap">{property.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {property.bedrooms && (
                      <span>{t("bedrooms")}: {property.bedrooms}</span>
                    )}
                    {property.bathrooms && (
                      <span>{t("bathrooms")}: {property.bathrooms}</span>
                    )}
                    {property.squareMeters && (
                      <span>{property.squareMeters} m²</span>
                    )}
                  </div>
                </div>
              </section>
            )}

            {property.amenities && property.amenities.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
                  {t("amenities")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <Badge key={a} variant="default">
                      {a}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {(property.tenantName ?? property.tenantLineId ?? property.agentName ?? property.agentLineId ?? property.lineGroup ?? property.contractStartDate) && (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
                  {t("residentAgent")}
                </h3>
                <div className="space-y-1 text-sm text-slate-600">
                  {(property.tenantName || property.tenantLineId) && (
                    <p>
                      {t("tenant")}: {property.tenantName ?? t("noValue")}
                      {property.tenantLineId && (
                        <span className="text-slate-500"> (LINE: {property.tenantLineId})</span>
                      )}
                    </p>
                  )}
                  {(property.agentName || property.agentLineId) && (
                    <p>
                      {t("agent")}: {property.agentName ?? t("noValue")}
                      {property.agentLineId && (
                        <span className="text-slate-500"> (LINE: {property.agentLineId})</span>
                      )}
                    </p>
                  )}
                  {property.lineGroup && (
                    <p>{t("lineGroup")}: {property.lineGroup}</p>
                  )}
                  {property.contractStartDate && (
                    <p>{t("contractStart")}: {property.contractStartDate}</p>
                  )}
                </div>
              </section>
            )}

            {(property.tenantLineId ?? property.agentLineId ?? property.lineGroup) && (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
                  {t("contactCommunity")}
                </h3>
                <div className="space-y-3">
                  {property.tenantLineId && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <a
                        href={`https://line.me/ti/p/~${property.tenantLineId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium bg-gradient-to-r from-[#06C755] to-[#00B900] hover:opacity-90 active:opacity-95 tap-target min-h-[44px]"
                      >
                        <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
                        <span>{t("contactResident")}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(property.tenantLineId!)}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-white text-[#0F172A] font-medium hover:bg-slate-50 tap-target min-h-[44px] shrink-0 sm:w-auto w-full"
                      >
                        <Copy className="h-4 w-4 shrink-0" aria-hidden />
                        <span>{t("copyId")}</span>
                      </button>
                    </div>
                  )}
                  {property.agentLineId && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <a
                        href={`https://line.me/ti/p/~${property.agentLineId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium bg-gradient-to-r from-[#06C755] to-[#00B900] hover:opacity-90 active:opacity-95 tap-target min-h-[44px]"
                      >
                        <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
                        <span>{t("contactAgent")}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(property.agentLineId!)}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-white text-[#0F172A] font-medium hover:bg-slate-50 tap-target min-h-[44px] shrink-0 sm:w-auto w-full"
                      >
                        <Copy className="h-4 w-4 shrink-0" aria-hidden />
                        <span>{t("copyId")}</span>
                      </button>
                    </div>
                  )}
                  {property.lineGroup && (
                    <a
                      href={property.lineGroup.startsWith("http") ? property.lineGroup : `https://line.me/ti/g/${property.lineGroup}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-[#0F172A] font-medium hover:bg-slate-100 hover:border-slate-300 tap-target min-h-[44px]"
                    >
                      <Users className="h-5 w-5 shrink-0" aria-hidden />
                      <span>{t("joinGroupChat")}</span>
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
          );
        })()}
      </main>
    </div>
  );
}
