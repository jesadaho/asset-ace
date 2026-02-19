"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronRight, Plus, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

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

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  useEffect(() => {
    let cancelled = false;
    async function fetchProperties() {
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (!token) {
          if (!cancelled) setError("Please log in with LINE.");
          return;
        }
        const res = await fetch("/api/owner/properties", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 401) {
            setError("Please log in with LINE.");
            return;
          }
          const data = await res.json().catch(() => ({}));
          setError(data.message ?? `Failed to load properties (${res.status})`);
          return;
        }
        const data = await res.json();
        const list = (data.properties ?? []).map((p: { id: string; name: string; type: string; status: string; price: number; address: string; imageUrl?: string }) => ({
          id: p.id,
          name: p.name,
          type: p.type as PropertyType,
          status: p.status as PropertyStatus,
          price: p.price,
          address: p.address,
          image: p.imageUrl,
        }));
        setProperties(list);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load properties");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProperties();
    return () => { cancelled = true; };
  }, []);

  const filteredProperties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return properties.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "All" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [properties, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    const total = properties.length;
    const occupied = properties.filter((p) => p.status === "Occupied").length;
    const available = properties.filter((p) => p.status === "Available").length;
    const maintenance = properties.filter(
      (p) => p.status === "Maintenance"
    ).length;
    return { total, occupied, available, maintenance };
  }, [properties]);

  return (
    <div className="min-h-full bg-slate-50 p-4">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-4">
        My Properties
      </h1>

      {error && (
        <p className="text-red-500 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-slate-500 text-sm mb-4">Loading properties...</p>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="default">Total: {counts.total}</Badge>
        <Badge variant="error">Occupied: {counts.occupied}</Badge>
        <Badge variant="success">Available: {counts.available}</Badge>
        {counts.maintenance > 0 && (
          <Badge variant="warning">Maintenance: {counts.maintenance}</Badge>
        )}
      </div>

      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
              onClick={() => setStatusFilter(option)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === option
                  ? "bg-[#0F172A] text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {option}
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
                    {property.status}
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
                    ฿{property.price.toLocaleString()} / mo
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-[#10B981] font-medium">
                    View Details
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
            ? "You have no properties yet. Add one to get started."
            : "No properties match your search."}
        </p>
      )}

      <Link
        href="/owner/properties/add"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#10B981] text-white shadow-lg hover:bg-[#0D9668] active:bg-[#0B7A56] transition-colors tap-target"
        aria-label="Add property"
      >
        <Plus className="h-7 w-7" aria-hidden />
      </Link>
    </div>
  );
}
