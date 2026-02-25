"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { uploadFilesWithProgress } from "@/lib/uploadWithProgress";

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
  contractKey?: string;
  contractUrl?: string;
};

export default function AgentPropertyEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const t = useTranslations("agentProperty");
  const tDetail = useTranslations("propertyDetail");
  const tEdit = useTranslations("propertyEdit");
  const tAuth = useTranslations("auth");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccess, setNoAccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [tenantName, setTenantName] = useState("");
  const [tenantLineId, setTenantLineId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentProfile, setAgentProfile] = useState<{
    displayName: string;
    pictureUrl?: string;
  } | null>(null);
  const [lineGroup, setLineGroup] = useState("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [leaseDurationMonths, setLeaseDurationMonths] = useState("");
  const [contractKey, setContractKey] = useState<string | undefined>(undefined);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const contractInputRef = useRef<HTMLInputElement>(null);

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
          setContractKey((data as { contractKey?: string }).contractKey ?? undefined);
          setError(null);
          liff.getProfile().then(
            (p) => {
              if (!cancelled) setAgentProfile({ displayName: p.displayName, pictureUrl: p.pictureUrl });
            },
            () => {
              if (!cancelled) setAgentProfile(null);
            }
          );
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
      let finalContractKey: string | undefined = contractKey;
      if (contractFile) {
        setUploadProgress(0);
        try {
          const contractUpload = await uploadFilesWithProgress(
            [contractFile],
            setUploadProgress
          );
          const keys = (contractUpload.uploads ?? []).map((u) => u.key);
          if (keys.length > 0) finalContractKey = keys[0];
        } catch (uploadErr) {
          setSaveError(uploadErr instanceof Error ? uploadErr.message : t("saveFailed"));
          setSaving(false);
          return;
        }
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
          lineGroup: lineGroup.trim() || undefined,
          contractStartDate: contractStartDate.trim() || undefined,
          leaseDurationMonths:
            leaseNum !== undefined && !Number.isNaN(leaseNum) ? leaseNum : undefined,
          contractKey: finalContractKey,
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
              {tDetail("residentDetails")}
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
                {tDetail("lineIdOptional")}
              </label>
              <input
                id="agent-edit-tenant-line"
                type="text"
                value={tenantLineId}
                onChange={(e) => setTenantLineId(e.target.value)}
                placeholder={tDetail("lineUserIdPlaceholder")}
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
            {agentProfile && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  {tDetail("agentProfileReadOnly")}
                </p>
                <div className="flex items-center gap-3">
                  {agentProfile.pictureUrl && (
                    <img
                      src={agentProfile.pictureUrl}
                      alt=""
                      className="h-10 w-10 rounded-full bg-slate-200 object-cover"
                    />
                  )}
                  <p className="font-medium text-[#0F172A] truncate">
                    {agentProfile.displayName}
                  </p>
                </div>
              </div>
            )}
            <div>
              <label htmlFor="agent-edit-line-group" className="block text-sm text-slate-500 mb-1">
                {tDetail("lineGroup")}
              </label>
              <input
                id="agent-edit-line-group"
                type="text"
                value={lineGroup}
                onChange={(e) => setLineGroup(e.target.value)}
                placeholder={tDetail("lineGroupPlaceholder")}
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
                placeholder={tEdit("leaseDurationPlaceholder")}
                className={inputBase}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">
                {tEdit("contractFileOptional")}
              </label>
              <input
                ref={contractInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setContractFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => contractInputRef.current?.click()}
                className="text-sm text-[#10B981] hover:underline"
              >
                {contractFile
                  ? contractFile.name
                  : contractKey
                    ? tEdit("replaceContractFile")
                    : tEdit("chooseFilePdf")}
              </button>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <p className="text-sm text-slate-500 mt-1">{t("saving")}…</p>
              )}
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
