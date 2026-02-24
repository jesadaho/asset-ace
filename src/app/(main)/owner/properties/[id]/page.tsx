"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ImageIcon, Pencil, MessageCircle, Copy, Users, Layers, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

type PropertyType = "Condo" | "House" | "Apartment";
type PropertyStatus = "Available" | "Occupied" | "Draft";

const statusBadgeVariant: Record<
  PropertyStatus,
  "success" | "error" | "default"
> = {
  Available: "success",
  Occupied: "error",
  Draft: "default",
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
  leaseDurationMonths?: number;
  contractUrl?: string;
  reservedAt?: string;
  reservedByName?: string;
  reservedByContact?: string;
  createdAt?: string;
};

type RentalHistoryItem = {
  id: string;
  tenantName: string;
  agentName?: string;
  startDate: string;
  endDate: string | null;
  durationMonths: number;
  contractUrl?: string;
  rentPriceAtThatTime: number;
};

function isContractEnded(contractStartDate: string, leaseDurationMonths: number): boolean {
  const start = new Date(contractStartDate);
  if (Number.isNaN(start.getTime())) return false;
  const end = new Date(start);
  end.setMonth(end.getMonth() + leaseDurationMonths);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return today >= end;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const t = useTranslations("propertyDetail");
  const tAuth = useTranslations("auth");
  const tProps = useTranslations("properties");
  const tInvite = useTranslations("invite");
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneMode, setCloneMode] = useState<"single" | "multiple">("single");
  const [cloneNewName, setCloneNewName] = useState("");
  const [cloneBulkCount, setCloneBulkCount] = useState(2);
  const [cloneBulkUnitNumbers, setCloneBulkUnitNumbers] = useState("");
  const [cloneLoading, setCloneLoading] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [cloneBulkSuccess, setCloneBulkSuccess] = useState<number | null>(null);
  const [rentalHistory, setRentalHistory] = useState<RentalHistoryItem[]>([]);
  const [rentalHistoryLoading, setRentalHistoryLoading] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveName, setReserveName] = useState("");
  const [reserveContact, setReserveContact] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

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

  useEffect(() => {
    if (!id || !property) return;
    let cancelled = false;
    async function fetchHistory() {
      setRentalHistoryLoading(true);
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (!token || cancelled) return;
        const res = await fetch(`/api/owner/properties/${id}/rental-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setRentalHistory(data.history ?? []);
        }
      } catch {
        if (!cancelled) setRentalHistory([]);
      } finally {
        if (!cancelled) setRentalHistoryLoading(false);
      }
    }
    fetchHistory();
    return () => { cancelled = true; };
  }, [id, property]);

  const handleCheckout = useCallback(async () => {
    if (!id) return;
    setCheckoutLoading(true);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        setCheckoutLoading(false);
        return;
      }
      const res = await fetch(`/api/owner/properties/${id}/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCheckoutLoading(false);
        return;
      }
      setCheckoutModalOpen(false);
      const refetchRes = await fetch(`/api/owner/properties/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refetchRes.ok) {
        const data = await refetchRes.json();
        setProperty(data.property ?? null);
      }
      setRentalHistory((prev) => []);
      const historyRes = await fetch(`/api/owner/properties/${id}/rental-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setRentalHistory(historyData.history ?? []);
      }
    } finally {
      setCheckoutLoading(false);
    }
  }, [id]);

  const handleReserve = useCallback(async () => {
    if (!id) return;
    setReserveLoading(true);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        setReserveLoading(false);
        return;
      }
      const res = await fetch(`/api/owner/properties/${id}/reserve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservedByName: reserveName.trim() || undefined,
          reservedByContact: reserveContact.trim() || undefined,
        }),
      });
      if (!res.ok) {
        setReserveLoading(false);
        return;
      }
      setReserveModalOpen(false);
      setReserveName("");
      setReserveContact("");
      const refetchRes = await fetch(`/api/owner/properties/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refetchRes.ok) {
        const data = await refetchRes.json();
        setProperty(data.property ?? null);
      }
    } finally {
      setReserveLoading(false);
    }
  }, [id, reserveName, reserveContact]);

  const handleInviteAgent = useCallback(async () => {
    if (!id) return;
    setInviteLoading(true);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        setInviteLoading(false);
        return;
      }
      const res = await fetch(`/api/owner/properties/${id}/invite-link`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setInviteLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const inviteUrl = data.inviteUrl;
      if (!inviteUrl || typeof inviteUrl !== "string") {
        setInviteLoading(false);
        return;
      }
      const shareText = tInvite("shareMessage").replace("{url}", inviteUrl);
      window.location.href = `https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`;
    } finally {
      setInviteLoading(false);
    }
  }, [id, tInvite]);

  const handleClearReservation = useCallback(async () => {
    if (!id) return;
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) return;
      const res = await fetch(`/api/owner/properties/${id}/reserve`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const refetchRes = await fetch(`/api/owner/properties/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refetchRes.ok) {
        const data = await refetchRes.json();
        setProperty(data.property ?? null);
      }
    } catch {
      // ignore
    }
  }, [id]);

  const handleCloneConfirm = useCallback(async () => {
    if (!id) return;
    setCloneError(null);
    setCloneLoading(true);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        setCloneError(tAuth("pleaseLogin"));
        setCloneLoading(false);
        return;
      }
      if (cloneMode === "multiple") {
        const count = Math.min(50, Math.max(2, cloneBulkCount));
        const lines = cloneBulkUnitNumbers
          .split(/\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        const unitNumbers = lines.length === count ? lines : undefined;
        const res = await fetch("/api/owner/properties/clone", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sourceId: id,
            count,
            unitNumbers,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setCloneError(data.message ?? t("cloneError"));
          setCloneLoading(false);
          return;
        }
        const properties = data.properties;
        if (Array.isArray(properties) && properties.length > 0) {
          setCloneBulkSuccess(properties.length);
          setCloneBulkCount(2);
          setCloneBulkUnitNumbers("");
          setTimeout(() => {
            setCloneModalOpen(false);
            setCloneBulkSuccess(null);
            router.push("/owner/properties");
          }, 1500);
        } else {
          setCloneError(t("cloneError"));
        }
        setCloneLoading(false);
        return;
      }
      const res = await fetch("/api/owner/properties/clone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceId: id,
          newName: cloneNewName.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCloneError(data.message ?? t("cloneError"));
        setCloneLoading(false);
        return;
      }
      const newId = data.property?.id;
      if (newId) {
        setCloneModalOpen(false);
        setCloneNewName("");
        router.push(`/owner/properties/${newId}/edit`);
      } else {
        setCloneError(t("cloneError"));
      }
    } catch (err) {
      setCloneError(err instanceof Error ? err.message : t("cloneError"));
    } finally {
      setCloneLoading(false);
    }
  }, [id, cloneMode, cloneNewName, cloneBulkCount, cloneBulkUnitNumbers, t, tAuth, router]);

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
            <>
              {(property.status === "Available" || property.status === "Occupied") && (
                <button
                  type="button"
                  onClick={handleInviteAgent}
                  disabled={inviteLoading}
                  className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[#06C755] font-medium hover:bg-[#06C755]/10 tap-target min-h-[44px] disabled:opacity-50"
                  aria-label={tInvite("inviteAgentAria")}
                >
                  <UserPlus className="h-4 w-4" aria-hidden />
                  <span className="text-sm sr-only sm:not-sr-only">{tInvite("inviteAgent")}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setCloneModalOpen(true)}
                className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 tap-target min-h-[44px]"
                aria-label={t("cloneAria")}
              >
                <Layers className="h-4 w-4" aria-hidden />
                <span className="text-sm sr-only sm:not-sr-only">{t("clone")}</span>
              </button>
              <Link
                href={`/owner/properties/${id}/edit`}
                className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[#10B981] font-medium hover:bg-[#10B981]/10 tap-target min-h-[44px]"
                aria-label={t("editAria")}
              >
                <Pencil className="h-4 w-4" aria-hidden />
                <span className="text-sm">{t("edit")}</span>
              </Link>
            </>
          )}
          {!property && !loading && <span className="w-14" aria-hidden />}
        </div>
      </header>

      {cloneModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clone-modal-title"
          aria-describedby="clone-modal-desc"
        >
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 id="clone-modal-title" className="text-lg font-semibold text-[#0F172A]">
              {t("cloneConfirmTitle")}
            </h2>
            <p id="clone-modal-desc" className="text-sm text-slate-600">
              {t("cloneConfirmMessage")}
            </p>
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setCloneMode("single")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium tap-target ${
                  cloneMode === "single"
                    ? "bg-[#10B981] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t("clone")}
              </button>
              <button
                type="button"
                onClick={() => setCloneMode("multiple")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium tap-target ${
                  cloneMode === "multiple"
                    ? "bg-[#10B981] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t("cloneMultiple")}
              </button>
            </div>
            {cloneMode === "single" ? (
              <div>
                <label htmlFor="clone-new-name" className="sr-only">
                  {t("newUnitNamePlaceholder")}
                </label>
                <Input
                  id="clone-new-name"
                  type="text"
                  placeholder={t("newUnitNamePlaceholder")}
                  value={cloneNewName}
                  onChange={(e) => setCloneNewName(e.target.value)}
                  className="w-full"
                  disabled={cloneLoading}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label htmlFor="clone-bulk-count" className="block text-sm font-medium text-slate-700 mb-1">
                    {t("cloneMultipleCount")}
                  </label>
                  <Input
                    id="clone-bulk-count"
                    type="number"
                    min={2}
                    max={50}
                    value={cloneBulkCount}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!Number.isNaN(n)) setCloneBulkCount(Math.min(50, Math.max(2, n)));
                    }}
                    disabled={cloneLoading}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="clone-bulk-units" className="block text-sm font-medium text-slate-700 mb-1">
                    {t("cloneMultipleUnitNumbers")}
                  </label>
                  <textarea
                    id="clone-bulk-units"
                    rows={4}
                    placeholder={t("cloneMultipleUnitNumbers")}
                    value={cloneBulkUnitNumbers}
                    onChange={(e) => setCloneBulkUnitNumbers(e.target.value)}
                    disabled={cloneLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-base text-[#0F172A] placeholder:text-[#0F172A]/50 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 min-h-[88px] tap-target"
                  />
                </div>
              </div>
            )}
            {cloneBulkSuccess !== null && (
              <p className="text-sm text-[#10B981]" role="status">
                {t("cloneMultipleSuccess", { count: cloneBulkSuccess })}
              </p>
            )}
            {cloneError && (
              <p className="text-sm text-red-600" role="alert">
                {cloneError}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!cloneLoading) {
                    setCloneModalOpen(false);
                    setCloneNewName("");
                    setCloneMode("single");
                    setCloneBulkCount(2);
                    setCloneBulkUnitNumbers("");
                    setCloneError(null);
                    setCloneBulkSuccess(null);
                  }
                }}
                className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 tap-target min-h-[44px] disabled:opacity-50"
                disabled={cloneLoading}
              >
                {t("cloneCancel")}
              </button>
              <button
                type="button"
                onClick={handleCloneConfirm}
                className="px-4 py-2 rounded-lg bg-[#10B981] text-white font-medium hover:bg-[#10B981]/90 tap-target min-h-[44px] disabled:opacity-50"
                disabled={cloneLoading}
                aria-busy={cloneLoading}
              >
                {cloneLoading
                  ? t("loading")
                  : cloneMode === "multiple"
                    ? t("cloneMultipleSubmit")
                    : t("cloneConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

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

            {property.status === "Available" && (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                {!property.reservedAt ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setReserveModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100 tap-target min-h-[44px]"
                    >
                      {t("reserve")}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="warning">{t("reserved")}</Badge>
                    </div>
                    {(property.reservedByName || property.reservedByContact) && (
                      <div className="text-sm text-slate-600 space-y-0.5">
                        {property.reservedByName && (
                          <p>{t("reservedByName")}: {property.reservedByName}</p>
                        )}
                        {property.reservedByContact && (
                          <p>{t("reservedByContact")}: {property.reservedByContact}</p>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleClearReservation}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 tap-target min-h-[40px]"
                    >
                      {t("clearReservation")}
                    </button>
                  </div>
                )}
              </section>
            )}

            {reserveModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="reserve-title">
                <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-4 space-y-4">
                  <h2 id="reserve-title" className="text-lg font-semibold text-[#0F172A]">{t("reserve")}</h2>
                  <p className="text-sm text-slate-600">{t("reservedByName")} / {t("reservedByContact")} (optional)</p>
                  <div>
                    <label htmlFor="reserve-name" className="block text-sm text-slate-500 mb-1">{t("reservedByName")}</label>
                    <input
                      id="reserve-name"
                      type="text"
                      value={reserveName}
                      onChange={(e) => setReserveName(e.target.value)}
                      placeholder=""
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-[#0F172A] min-h-[44px]"
                      disabled={reserveLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="reserve-contact" className="block text-sm text-slate-500 mb-1">{t("reservedByContact")}</label>
                    <input
                      id="reserve-contact"
                      type="text"
                      value={reserveContact}
                      onChange={(e) => setReserveContact(e.target.value)}
                      placeholder=""
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-[#0F172A] min-h-[44px]"
                      disabled={reserveLoading}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => { if (!reserveLoading) setReserveModalOpen(false); }}
                      className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#0F172A] hover:bg-slate-50 min-h-[44px]"
                      disabled={reserveLoading}
                    >
                      {t("cloneCancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleReserve}
                      className="px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 min-h-[44px] disabled:opacity-60"
                      disabled={reserveLoading}
                    >
                      {reserveLoading ? t("loading") : t("reserve")}
                    </button>
                  </div>
                </div>
              </div>
            )}

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

            {property.status !== "Available" && (property.tenantName ?? property.tenantLineId ?? property.agentName ?? property.agentLineId ?? property.lineGroup ?? property.contractStartDate) && (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2 flex-wrap">
                  {t("residentAgent")}
                  {property.status === "Occupied" && property.contractStartDate && property.leaseDurationMonths != null && isContractEnded(property.contractStartDate, property.leaseDurationMonths) && (
                    <Badge variant="default">{t("contractEnded")}</Badge>
                  )}
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
                  {property.leaseDurationMonths != null && (
                    <p>{t("leaseDuration")}: {property.leaseDurationMonths} {t("months")}</p>
                  )}
                  {property.contractUrl && (
                    <a
                      href={property.contractUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#10B981] hover:underline text-sm"
                    >
                      {t("viewContract")}
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleInviteAgent}
                      disabled={inviteLoading}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#06C755]/30 bg-[#06C755]/10 text-[#06C755] font-medium hover:bg-[#06C755]/20 text-sm disabled:opacity-50"
                      aria-label={tInvite("inviteAgentAria")}
                    >
                      <UserPlus className="h-4 w-4" aria-hidden />
                      {tInvite("inviteAgent")}
                    </button>
                    {property.status === "Occupied" && (
                      <>
                        <Link
                          href={`/owner/properties/${id}/edit`}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-[#0F172A] font-medium hover:bg-slate-50 text-sm"
                        >
                          {t("edit")}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setCheckoutModalOpen(true)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 font-medium hover:bg-amber-100 text-sm"
                        >
                          {t("checkout")}
                        </button>
                      </>
                    )}
                  </div>
              </section>
            )}

            {checkoutModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
                <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-4 space-y-4">
                  <h2 id="checkout-title" className="text-lg font-semibold text-[#0F172A]">{t("checkoutConfirmTitle")}</h2>
                  <p className="text-sm text-slate-600">{t("checkoutConfirmMessage")}</p>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => { if (!checkoutLoading) setCheckoutModalOpen(false); }}
                      className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 disabled:opacity-50"
                      disabled={checkoutLoading}
                    >
                      {t("cloneCancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50"
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? t("loading") : t("checkout")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {property.status !== "Available" && (property.tenantLineId ?? property.agentLineId ?? property.lineGroup) && (
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

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
                {t("rentalHistory")}
              </h3>
              {rentalHistoryLoading ? (
                <p className="text-sm text-slate-500">{t("loading")}</p>
              ) : rentalHistory.length === 0 ? (
                <p className="text-sm text-slate-500">{t("noRentalHistory")}</p>
              ) : (
                <ul className="space-y-3">
                  {rentalHistory.map((record) => (
                    <li key={record.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="text-sm text-slate-600 space-y-0.5">
                        <p className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[#0F172A]">{record.tenantName}</span>
                          {record.agentName ? <span>· {t("agent")}: {record.agentName}</span> : null}
                          {record.endDate ? <Badge variant="default">{t("contractCompleted")}</Badge> : null}
                        </p>
                        <p>{t("contractStart")}: {record.startDate} {record.endDate ? `– ${record.endDate}` : `(${t("current")})`}</p>
                        <p>{t("leaseDuration")}: {record.durationMonths} {t("months")} · ฿{record.rentPriceAtThatTime.toLocaleString()}{tProps("perMonth")}</p>
                        {record.contractUrl && (
                          <a href={record.contractUrl} target="_blank" rel="noopener noreferrer" className="text-[#10B981] hover:underline text-sm">{t("viewContract")}</a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          );
        })()}
      </main>
    </div>
  );
}
