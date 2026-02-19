"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ImageIcon, Pencil } from "lucide-react";
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
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el || el.offsetWidth <= 0) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    setPhotoIndex(Math.min(index, (el.children.length ?? 1) - 1));
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Invalid property");
      return;
    }
    let cancelled = false;
    async function fetchProperty() {
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (!token) {
          if (!cancelled) setError("Please log in with LINE.");
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/owner/properties/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.status === 401) {
          setError("Please log in with LINE.");
          setLoading(false);
          return;
        }
        if (res.status === 404) {
          setError("Property not found.");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.message ?? `Failed to load property (${res.status})`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProperty(data.property ?? null);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load property");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProperty();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white safe-area-top pt-4">
        <div className="flex max-w-lg mx-auto items-center gap-2 px-4 py-3">
          <Link
            href="/owner/properties"
            className="shrink-0 flex items-center justify-center p-2 -m-2 text-[#0F172A] hover:text-[#003366] tap-target min-h-[44px] min-w-[44px]"
            aria-label="Back to properties"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="min-w-0 flex-1 text-lg font-semibold text-[#0F172A] text-center truncate">
            {property?.name ?? "Property Details"}
          </h1>
          {property && (
            <Link
              href={`/owner/properties/${id}/edit`}
              className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[#10B981] font-medium hover:bg-[#10B981]/10 tap-target min-h-[44px]"
              aria-label="Edit property"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              <span className="text-sm">Edit</span>
            </Link>
          )}
          {!property && !loading && <span className="w-14" aria-hidden />}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {loading && (
          <p className="text-slate-500 text-sm">Loading property...</p>
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
                aria-label="Property photos"
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
                            aria-label={`Photo ${i + 1} of ${urls.length}`}
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
                    {property.status}
                  </Badge>
                </span>
              </div>
              <div className="p-4 space-y-3">
                <h2 className="text-xl font-bold text-[#0F172A]">
                  {property.name}
                </h2>
                <p className="text-slate-600 text-sm">{property.type}</p>
                <p className="font-semibold text-[#0F172A]">
                  ฿{property.price.toLocaleString()} / mo
                </p>
                <p className="text-slate-600 text-sm">{property.address}</p>
              </div>
            </div>

            {(property.description ?? property.bedrooms ?? property.bathrooms ?? property.squareMeters) && (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
                  Details
                </h3>
                <div className="space-y-2 text-sm text-slate-600">
                  {property.description && (
                    <p className="whitespace-pre-wrap">{property.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {property.bedrooms && (
                      <span>Bedrooms: {property.bedrooms}</span>
                    )}
                    {property.bathrooms && (
                      <span>Bathrooms: {property.bathrooms}</span>
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
                  Amenities
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
                  Resident / Agent
                </h3>
                <div className="space-y-1 text-sm text-slate-600">
                  {(property.tenantName || property.tenantLineId) && (
                    <p>
                      Tenant: {property.tenantName ?? "—"}
                      {property.tenantLineId && (
                        <span className="text-slate-500"> (LINE: {property.tenantLineId})</span>
                      )}
                    </p>
                  )}
                  {(property.agentName || property.agentLineId) && (
                    <p>
                      Agent: {property.agentName ?? "—"}
                      {property.agentLineId && (
                        <span className="text-slate-500"> (LINE: {property.agentLineId})</span>
                      )}
                    </p>
                  )}
                  {property.lineGroup && (
                    <p>LINE Group: {property.lineGroup}</p>
                  )}
                  {property.contractStartDate && (
                    <p>Contract start: {property.contractStartDate}</p>
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
