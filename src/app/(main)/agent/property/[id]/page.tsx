"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ImageIcon, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type PropertyDetail = {
  id: string;
  name: string;
  type: string;
  price: number;
  address: string;
  description?: string;
  bedrooms?: string;
  bathrooms?: string;
  squareMeters?: string;
  amenities?: string[];
  imageUrls?: string[];
};

export default function AgentPropertyDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const t = useTranslations("agentProperty");
  const tDetail = useTranslations("propertyDetail");
  const tProps = useTranslations("properties");
  const tAuth = useTranslations("auth");
  const tMarket = useTranslations("marketplace");
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [requestSent, setRequestSent] = useState(false);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el || el.offsetWidth <= 0) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    setPhotoIndex(Math.min(index, (el.children.length ?? 1) - 1));
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError(t("notFound"));
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
        const res = await fetch(`/api/agent/property/${id}`, {
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
        setProperty({
          id: data.id,
          name: data.name,
          type: data.type,
          price: data.price,
          address: data.address,
          description: data.description,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          squareMeters: data.squareMeters,
          amenities: data.amenities ?? [],
          imageUrls: data.imageUrls ?? [],
        });
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

  const handleRequestToAgent = () => {
    setRequestSent(true);
  };

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col items-center justify-center p-4">
        <div
          className="h-8 w-8 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin"
          aria-hidden
        />
        <p className="text-slate-600 text-sm mt-3">{t("loading")}</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-full bg-slate-50 p-4">
        <Link
          href="/agent/marketplace"
          className="inline-flex items-center gap-2 text-sm text-[#10B981] font-medium hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("backToMarketplace")}
        </Link>
        <p className="text-red-500 text-sm" role="alert">
          {error ?? t("notFound")}
        </p>
      </div>
    );
  }

  const urls = property.imageUrls?.length ? property.imageUrls : [];

  return (
    <div className="min-h-full bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/agent/marketplace"
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 tap-target"
            aria-label={t("backToMarketplace")}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="text-lg font-semibold text-[#0F172A] truncate flex-1 min-w-0">
            {t("title")}
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth aspect-[4/3] bg-slate-200 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            aria-label={tDetail("photosAria")}
          >
            {urls.length > 0 ? (
              urls.map((url, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-full snap-start flex items-center justify-center"
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="flex-shrink-0 w-full flex items-center justify-center text-slate-400">
                <ImageIcon className="h-12 w-12" aria-hidden />
              </div>
            )}
          </div>
          {urls.length > 1 && (
            <div className="flex justify-center gap-1.5 py-2 bg-white">
              {urls.map((_, i) => (
                <span
                  key={i}
                  className={`inline-block w-2 h-2 rounded-full transition-colors ${
                    i === photoIndex ? "bg-[#10B981]" : "bg-slate-300"
                  }`}
                  aria-hidden
                />
              ))}
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-[#0F172A]">{property.name}</h2>
              <Badge
                variant="success"
                className="bg-[#10B981]/90 text-white border-[#10B981] shrink-0"
              >
                {tMarket("commissionBadge")}
              </Badge>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">{property.type}</p>
            <p className="font-semibold text-[#0F172A] mt-2">
              ฿{property.price.toLocaleString()} {tProps("perMonth")}
            </p>
            <p className="text-slate-600 text-sm mt-1">{property.address}</p>
          </div>
        </div>

        {(property.description ||
          property.bedrooms ||
          property.bathrooms ||
          property.squareMeters ||
          (property.amenities && property.amenities.length > 0)) && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mt-4">
            <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide mb-3">
              {tDetail("details")}
            </h3>
            {property.description && (
              <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3">
                {property.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              {property.bedrooms && (
                <span>{tDetail("bedrooms")}: {property.bedrooms}</span>
              )}
              {property.bathrooms && (
                <span>{tDetail("bathrooms")}: {property.bathrooms}</span>
              )}
              {property.squareMeters && (
                <span>{property.squareMeters} m²</span>
              )}
            </div>
            {property.amenities && property.amenities.length > 0 && (
              <>
                <h4 className="text-sm font-medium text-[#0F172A] mt-3 mb-1">
                  {tDetail("amenities")}
                </h4>
                <ul className="flex flex-wrap gap-2">
                  {property.amenities.map((a, i) => (
                    <li key={i}>
                      <Badge variant="default" className="text-xs">
                        {a}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        <div className="mt-6">
          {requestSent ? (
            <div className="rounded-xl border-2 border-[#10B981]/30 bg-[#10B981]/10 p-4 text-center">
              <p className="text-sm font-medium text-[#0D9668]">
                {t("requestSent")}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRequestToAgent}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#10B981] text-white font-medium hover:bg-[#0D9668] active:bg-[#0B7A56] tap-target min-h-[48px] shadow-lg shadow-[#10B981]/20"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              {t("requestToAgent")}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
