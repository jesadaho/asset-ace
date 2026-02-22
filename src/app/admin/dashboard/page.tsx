"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  UserCog,
  Search,
  Eye,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Stats = {
  totalProperties: number;
  activeOwners: number;
  totalAgents: number;
};

type PropertyRow = {
  id: string;
  name: string;
  ownerName: string;
  assignedAgent: string;
  location: string;
  status: string;
};

type OwnerRow = {
  lineUserId: string;
  name: string;
  phone: string;
  createdAt?: string;
  propertyCount?: number;
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Available", label: "Available" },
  { value: "Occupied", label: "Occupied" },
  { value: "Draft", label: "Draft" },
];

const AGENT_OPTIONS = [
  { value: "", label: "All" },
  { value: "yes", label: "Assigned" },
  { value: "no", label: "Unassigned" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  /** Show only overview, only owners table, or only properties table based on card click */
  const [visibleSection, setVisibleSection] = useState<"overview" | "owners" | "properties">("properties");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch("/api/admin/stats", { headers });
      if (!res.ok) {
        setError("Failed to load stats.");
        return;
      }
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchOwners = useCallback(async () => {
    setOwnersLoading(true);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch("/api/admin/owners", { headers });
      if (!res.ok) {
        setError("Failed to load owners.");
        setOwners([]);
        setOwnersLoading(false);
        return;
      }
      const data = await res.json();
      setOwners(data.owners ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load owners.");
      setOwners([]);
    } finally {
      setOwnersLoading(false);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    setPropertiesLoading(true);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const params = new URLSearchParams();
      if (searchDebounced) params.set("search", searchDebounced);
      if (statusFilter) params.set("status", statusFilter);
      if (agentFilter) params.set("agentAssigned", agentFilter);
      const res = await fetch(`/api/admin/properties?${params.toString()}`, {
        headers,
      });
      if (!res.ok) {
        setError("Failed to load properties.");
        setProperties([]);
        setPropertiesLoading(false);
        return;
      }
      const data = await res.json();
      setProperties(data.properties ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load properties.");
      setProperties([]);
    } finally {
      setPropertiesLoading(false);
    }
  }, [searchDebounced, statusFilter, agentFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Available: "bg-emerald-100 text-emerald-800",
      Occupied: "bg-amber-100 text-amber-800",
      Draft: "bg-slate-200 text-slate-700",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          styles[status] ?? "bg-slate-100 text-slate-700"
        )}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Super Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Overview of the Asset Ace ecosystem
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Stats cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card
          variant="light"
          className={cn(
            "border-slate-200 cursor-pointer transition-colors",
            visibleSection === "properties" ? "ring-2 ring-emerald-500 border-emerald-400" : "hover:border-emerald-300"
          )}
          onClick={() => setVisibleSection((s) => (s === "properties" ? "overview" : "properties"))}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setVisibleSection((s) => (s === "properties" ? "overview" : "properties"))}
        >
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Total Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
            ) : (
              <span className="text-2xl font-bold text-slate-800">
                {stats?.totalProperties ?? "—"}
              </span>
            )}
          </CardContent>
        </Card>
        <Card
          variant="light"
          className={cn(
            "border-slate-200 cursor-pointer transition-colors",
            visibleSection === "owners" ? "ring-2 ring-blue-500 border-blue-400" : "hover:border-blue-300"
          )}
          onClick={() => setVisibleSection((s) => (s === "owners" ? "overview" : "owners"))}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setVisibleSection((s) => (s === "owners" ? "overview" : "owners"))}
        >
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Active Owners
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
            ) : (
              <span className="text-2xl font-bold text-slate-800">
                {stats?.activeOwners ?? "—"}
              </span>
            )}
          </CardContent>
        </Card>
        <Card variant="light" className="border-slate-200">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <UserCog className="h-4 w-4 text-violet-600" />
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
            ) : (
              <span className="text-2xl font-bold text-slate-800">
                {stats?.totalAgents ?? "—"}
              </span>
            )}
          </CardContent>
        </Card>
      </section>

      {/* All Owners – show only when Owners card is selected */}
      {visibleSection === "owners" && (
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setVisibleSection("overview")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to overview
          </button>
          <Card id="owners-section" variant="light" className="border-slate-200 overflow-hidden scroll-mt-4">
            <CardHeader className="border-b border-slate-200 bg-slate-50/50">
              <CardTitle className="text-lg text-slate-800">All Owners</CardTitle>
            </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">LINE ID</th>
                  <th className="px-4 py-3 text-right">Properties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ownersLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Loading owners…
                    </td>
                  </tr>
                ) : owners.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                      No owners found.
                    </td>
                  </tr>
                ) : (
                  owners.map((row) => (
                    <tr
                      key={row.lineUserId}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.phone}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs break-all">
                        {row.lineUserId}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {row.propertyCount ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
          </Card>
        </div>
      )}

      {/* Master property table – show only when Properties card is selected */}
      {visibleSection === "properties" && (
        <div>
          <button
            type="button"
            onClick={() => setVisibleSection("overview")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to overview
          </button>
          <Card id="properties-section" variant="light" className="border-slate-200 overflow-hidden scroll-mt-4">
            <CardHeader className="border-b border-slate-200 bg-slate-50/50">
              <CardTitle className="text-lg text-slate-800">All Properties</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="flex-1 min-w-0">
              <Input
                type="search"
                placeholder="Search by property name or owner name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="bg-white border-slate-200"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 min-w-[140px]"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 min-w-[140px]"
            >
              {AGENT_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3">Property Name</th>
                  <th className="px-4 py-3">Owner Name</th>
                  <th className="px-4 py-3">Assigned Agent</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-28 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {propertiesLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          Loading properties…
                        </td>
                      </tr>
                    ) : properties.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                          No properties match your filters.
                        </td>
                      </tr>
                    ) : (
                      properties.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {row.name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{row.ownerName}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {row.assignedAgent}
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                            {row.location}
                          </td>
                          <td className="px-4 py-3">{statusBadge(row.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/admin/properties/${row.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Eye className="h-4 w-4" />}
                              >
                                View Details
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
