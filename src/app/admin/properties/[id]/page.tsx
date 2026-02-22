"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Building2, User, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type PropertyDetail = {
  id: string;
  name: string;
  type: string;
  status: string;
  price: number;
  address: string;
  ownerName: string;
  ownerId: string;
  agentName?: string;
  agentLineId?: string;
  imageUrl?: string;
  description?: string;
  tenantName?: string;
  contractStartDate?: string;
};

export default function AdminPropertyDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Invalid property ID");
      return;
    }
    let cancelled = false;
    async function fetchProperty() {
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        const headers: HeadersInit = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`/api/admin/properties/${id}`, { headers });
        if (cancelled) return;
        if (res.status === 404) {
          setError("Property not found.");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.message ?? "Failed to load property.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProperty(data.property ?? null);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load property.");
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

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error ?? "Property not found."}
        </div>
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    Available: "bg-emerald-100 text-emerald-800",
    Occupied: "bg-amber-100 text-amber-800",
    Draft: "bg-slate-200 text-slate-700",
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <Card variant="light" className="border-slate-200 overflow-hidden mb-6">
        {property.imageUrl && (
          <div className="aspect-[4/3] bg-slate-100">
            <img
              src={property.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              {property.name}
            </CardTitle>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                statusStyles[property.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {property.status}
            </span>
          </div>
          <p className="text-slate-600 mt-1">{property.type} · ฿{property.price?.toLocaleString()}</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-500">Owner</p>
              <p className="text-slate-800">{property.ownerName}</p>
            </div>
          </div>
          {(property.agentName || property.agentLineId) && (
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-500">Assigned Agent</p>
                <p className="text-slate-800">{property.agentName ?? "—"}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-500">Location</p>
              <p className="text-slate-800">{property.address}</p>
            </div>
          </div>
          {property.tenantName && (
            <div>
              <p className="text-sm font-medium text-slate-500">Tenant</p>
              <p className="text-slate-800">{property.tenantName}</p>
              {property.contractStartDate && (
                <p className="text-sm text-slate-600 mt-0.5">
                  Contract from {property.contractStartDate}
                </p>
              )}
            </div>
          )}
          {property.description && (
            <div>
              <p className="text-sm font-medium text-slate-500">Description</p>
              <p className="text-slate-700 whitespace-pre-wrap">{property.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
