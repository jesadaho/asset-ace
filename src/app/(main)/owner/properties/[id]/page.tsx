"use client";

import { useState, useEffect } from "react";
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
  imageKeys?: string[];
  listingType?: string;
  bedrooms?: string;
  bathrooms?: string;
  addressPrivate?: boolean;
  description?: string;
  squareMeters?: string;
  amenities?: string[];
  tenantName?: string;
  agentName?: string;
  createdAt?: string;
};

export default function PropertyDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white safe-area-top">
        <div className="flex max-w-lg mx-auto items-center gap-3 px-4 py-3">
          <Link
            href="/owner/properties"
            className="flex items-center justify-center p-2 -m-2 text-[#0F172A] hover:text-[#003366] tap-target min-h-[44px] min-w-[44px]"
            aria-label="Back to properties"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="flex-1 text-lg font-semibold text-[#0F172A] text-center truncate -ml-12 mr-2">
            {property?.name ?? "Property Details"}
          </h1>
          {property && (
            <Link
              href={`/owner/properties/${id}/edit`}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[#10B981] font-medium hover:bg-[#10B981]/10 tap-target min-h-[44px]"
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

        {!loading && property && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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

            {(property.tenantName ?? property.agentName) && (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
                  Resident / Agent
                </h3>
                <div className="space-y-1 text-sm text-slate-600">
                  {property.tenantName && (
                    <p>Tenant: {property.tenantName}</p>
                  )}
                  {property.agentName && (
                    <p>Agent: {property.agentName}</p>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
