"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

const inputBase =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-base text-[#0F172A] placeholder:text-slate-400 focus:border-[#003366] focus:outline-none focus:ring-2 focus:ring-[#003366]/20 tap-target min-h-[44px]";

type PropertyEditData = {
  id: string;
  name: string;
  isManagingAgent?: boolean;
  tenantName?: string;
  tenantLineId?: string;
  agentName?: string;
  agentLineId?: string;
  lineGroup?: string;
  contractStartDate?: string;
  leaseDurationMonths?: number;
  description?: string;
  amenities?: string[];
};

export default function AgentPropertyEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const t = useTranslations("agentProperty");
  const tDetail = useTranslations("propertyDetail");
  const tAuth = useTranslations("auth");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccess, setNoAccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [tenantName, setTenantName] = useState("");
  const [tenantLineId, setTenantLineId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentLineId, setAgentLineId] = useState("");
  const [lineGroup, setLineGroup] = useState("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [leaseDurationMonths, setLeaseDurationMonths] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");

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
          setError(t("failedToLoad"));
          setLoading(false);
          return;
        }
        const data = (await res.json()) as PropertyEditData;
        if (!cancelled && !data.isManagingAgent) {
          setNoAccess(true);
          setLoading(false);
          return;
        }
        if (!cancelled) {
          setTenantName(data.tenantName ?? "");
          setTenantLineId(data.tenantLineId ?? "");
          setAgentName(data.agentName ?? "");
          setAgentLineId(data.agentLineId ?? "");
          setLineGroup(data.lineGroup ?? "");
          setContractStartDate(
            data.contractStartDate != null
              ? String(data.contractStartDate).slice(0, 10)
              : ""
          );
          setLeaseDurationMonths(
            data.leaseDurationMonths != null
              ? String(data.leaseDurationMonths)
              : ""
          );
          setDescription(data.description ?? "");
          setAmenities(data.amenities ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("failedToLoad"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProperty();
    return () => {
      cancelled = true;
    };
  }, [id, t, tAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        setSaveError(tAuth("pleaseLogin"));
        setSaving(false);
        return;
      }
      const leaseNum =
        leaseDurationMonths.trim() === ""
          ? undefined
          : parseInt(leaseDurationMonths, 10);
      const res = await fetch(`/api/agent/property/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantName: tenantName.trim() || undefined,
          tenantLineId: tenantLineId.trim() || undefined,
          agentName: agentName.trim() || undefined,
          agentLineId: agentLineId.trim() || undefined,
          lineGroup: lineGroup.trim() || undefined,
          contractStartDate: contractStartDate.trim() || undefined,
          leaseDurationMonths:
            leaseNum !== undefined && !Number.isNaN(leaseNum) ? leaseNum : undefined,
          description: description.trim() || undefined,
          amenities: amenities.length > 0 ? amenities : undefined,
        }),
      });
      if (res.status === 403) {
        setSaveError(t("noAccessEdit"));
        setSaving(false);
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setSaveError(data.message ?? t("saveFailed"));
        setSaving(false);
        return;
      }
      router.push(`/agent/property/${id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const addAmenity = () => {
    const v = amenityInput.trim();
    if (v && !amenities.includes(v)) {
      setAmenities((prev) => [...prev, v]);
      setAmenityInput("");
    }
  };

  const removeAmenity = (a: string) => {
    setAmenities((prev) => prev.filter((x) => x !== a));
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <div className="max-w-lg mx-auto px-4 py-8 text-center text-slate-600">
          {t("loading")}
        </div>
      </div>
    );
  }

  if (error || noAccess) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <div className="max-w-lg mx-auto px-4 py-8">
          <p className="text-red-600 mb-4" role="alert">
            {noAccess ? t("noAccessEdit") : error}
          </p>
          <Link
            href={id ? `/agent/property/${id}` : "/agent/marketplace"}
            className="inline-flex items-center gap-2 text-[#003366] font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToMarketplace")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white safe-area-top">
        <div className="flex max-w-lg mx-auto items-center gap-2 px-4 py-3">
          <Link
            href={`/agent/property/${id}`}
            className="shrink-0 flex items-center justify-center p-2 -m-2 text-[#0F172A] hover:text-[#003366] tap-target min-h-[44px] min-w-[44px]"
            aria-label={tDetail("backToProperties")}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="min-w-0 flex-1 text-lg font-semibold text-[#0F172A] text-center truncate">
            {t("editPageTitle")}
          </h1>
          <span className="w-9" aria-hidden />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        <form id="agent-edit-form" onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
              Resident Details
            </h2>
            <div>
              <label htmlFor="agent-edit-tenant" className="block text-sm font-medium text-[#0F172A] mb-1">
                {tDetail("tenant")}
              </label>
              <input
                id="agent-edit-tenant"
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder={tDetail("tenant")}
                className={inputBase}
              />
            </div>
            <div>
              <label htmlFor="agent-edit-tenant-line" className="block text-sm text-slate-500 mb-1">
                LINE ID (Optional)
              </label>
              <input
                id="agent-edit-tenant-line"
                type="text"
                value={tenantLineId}
                onChange={(e) => setTenantLineId(e.target.value)}
                placeholder="LINE user ID"
                className={inputBase}
              />
            </div>
            <div>
              <label htmlFor="agent-edit-agent" className="block text-sm font-medium text-[#0F172A] mb-1">
                {tDetail("agent")}
              </label>
              <input
                id="agent-edit-agent"
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder={tDetail("agent")}
                className={inputBase}
              />
            </div>
            <div>
              <label htmlFor="agent-edit-agent-line" className="block text-sm text-slate-500 mb-1">
                Agent LINE ID (Optional)
              </label>
              <input
                id="agent-edit-agent-line"
                type="text"
                value={agentLineId}
                onChange={(e) => setAgentLineId(e.target.value)}
                placeholder="LINE user ID"
                className={inputBase}
              />
            </div>
            <div>
              <label htmlFor="agent-edit-line-group" className="block text-sm text-slate-500 mb-1">
                {tDetail("lineGroup")}
              </label>
              <input
                id="agent-edit-line-group"
                type="text"
                value={lineGroup}
                onChange={(e) => setLineGroup(e.target.value)}
                placeholder="LINE group name or invite link"
                className={inputBase}
              />
            </div>
            <div>
              <label htmlFor="agent-edit-contract-start" className="block text-sm font-medium text-[#0F172A] mb-1">
                {tDetail("contractStart")}
              </label>
              <input
                id="agent-edit-contract-start"
                type="date"
                value={contractStartDate}
                onChange={(e) => setContractStartDate(e.target.value)}
                className={inputBase}
              />
            </div>
            <div>
              <label htmlFor="agent-edit-lease-months" className="block text-sm font-medium text-[#0F172A] mb-1">
                {tDetail("leaseDuration")} ({tDetail("months")})
              </label>
              <input
                id="agent-edit-lease-months"
                type="number"
                min={0}
                value={leaseDurationMonths}
                onChange={(e) => setLeaseDurationMonths(e.target.value)}
                placeholder="e.g. 12"
                className={inputBase}
              />
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
              {tDetail("details")}
            </h2>
            <div>
              <label htmlFor="agent-edit-description" className="block text-sm font-medium text-[#0F172A] mb-1">
                Description
              </label>
              <textarea
                id="agent-edit-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. แถมฟรีล้างแอร์ก่อนเข้าอยู่"
                className={`${inputBase} min-h-[100px] resize-y`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                {tDetail("amenities")}
              </label>
              <div className="flex gap-2 flex-wrap mb-2">
                {amenities.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-sm text-[#0F172A]"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => removeAmenity(a)}
                      className="text-slate-500 hover:text-red-600"
                      aria-label={`Remove ${a}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
                  placeholder="Add amenity"
                  className={inputBase}
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="shrink-0 px-4 py-3 rounded-lg border border-slate-200 bg-white text-[#0F172A] font-medium hover:bg-slate-50"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          {saveError && (
            <p className="text-red-600 text-sm" role="alert">
              {saveError}
            </p>
          )}
        </form>

        <div className="fixed bottom-0 left-0 right-0 z-30 max-w-lg mx-auto safe-area-bottom bg-white border-t border-slate-100 p-4">
          <button
            type="submit"
            form="agent-edit-form"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#003366] text-white font-medium hover:bg-[#002244] tap-target min-h-[48px] disabled:opacity-60"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </main>
    </div>
  );
}
