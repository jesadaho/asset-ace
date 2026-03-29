"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ImagePlus,
  X,
  Search,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { uploadFilesWithProgress } from "@/lib/uploadWithProgress";

const MAX_PHOTOS = 10;

const LISTING_TYPES = [
  { value: "rent", labelKey: "listingTypeRent" as const },
  { value: "sale", labelKey: "listingTypeSale" as const },
];

const PROPERTY_TYPES = [
  { value: "Condo", labelKey: "propertyTypeCondo" as const },
  { value: "House", labelKey: "propertyTypeHouse" as const },
  { value: "Apartment", labelKey: "propertyTypeApartment" as const },
];

const AMENITY_OPTIONS: { id: string; labelKey: string }[] = [
  { id: "balcony", labelKey: "amenityBalcony" },
  { id: "basement", labelKey: "amenityBasement" },
  { id: "bike-parking", labelKey: "amenityBikeParking" },
  { id: "cable-tv", labelKey: "amenityCableTv" },
  { id: "pool", labelKey: "amenityPool" },
  { id: "gym", labelKey: "amenityGym" },
  { id: "parking", labelKey: "amenityParking" },
  { id: "garden", labelKey: "amenityGarden" },
  { id: "security", labelKey: "amenitySecurity" },
  { id: "elevator", labelKey: "amenityElevator" },
  { id: "wifi", labelKey: "amenityWifi" },
  { id: "air-conditioning", labelKey: "amenityAirConditioning" },
];

const STATUS_OPTIONS = ["Available", "Occupied", "Draft", "Paused"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

const inputBase =
  "w-full rounded-lg border-b border-slate-200 bg-white px-0 py-3 text-base text-[#0F172A] placeholder:text-slate-400 transition-colors focus:border-[#003366] focus:outline-none focus:ring-0 tap-target min-h-[44px]";
const inputError = "border-red-500 focus:border-red-500";

const ROOM_STEPPER_MAX = 20;
const stepperBtnClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0F172A] shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-35 tap-target";

/** Top divider between major form sections (after photos). */
const formSectionClass = "border-t border-slate-200 pt-8";
const advancedCardClass =
  "space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/80";
const advancedCardTitleClass =
  "text-xs font-semibold uppercase tracking-wider text-slate-500";

export default function AddPropertyPage() {
  const router = useRouter();
  const t = useTranslations("propertyDetail");
  const tEdit = useTranslations("propertyEdit");
  const tProps = useTranslations("properties");
  const tCommon = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [listingType, setListingType] = useState<"sale" | "rent">("rent");
  const [saleWithTenant, setSaleWithTenant] = useState(false);
  const [propertyType, setPropertyType] = useState("Condo");
  const [salePrice, setSalePrice] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [address, setAddress] = useState("");
  const [bedroomCount, setBedroomCount] = useState(1);
  const [bathroomCount, setBathroomCount] = useState(1);
  const [addressPrivate, setAddressPrivate] = useState(false);
  const [description, setDescription] = useState("");
  const [squareMeters, setSquareMeters] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenitySearch, setAmenitySearch] = useState("");
  const [status, setStatus] = useState<Status>("Available");
  const [tenantName, setTenantName] = useState("");
  const [tenantLineId, setTenantLineId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentLineId, setAgentLineId] = useState("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [lineGroup, setLineGroup] = useState("");
  const [lineGroupId, setLineGroupId] = useState("");
  const [rentDueDayOfMonth, setRentDueDayOfMonth] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [nameError, setNameError] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  type ImageDebug = {
    presign: { status: number; ok: boolean; error?: string; hasUploads?: boolean };
    puts: { index: number; name: string; status: number; ok: boolean }[];
    error?: string;
    /** When error occurred: "presign" | "put_0" | "put_1" | ... */
    failedAt?: string;
    /** Error constructor name (e.g. TypeError) – "Load failed" often means CORS on S3 */
    errorName?: string;
  };
  const [imageDebug, setImageDebug] = useState<ImageDebug | null>(null);
  const [accessGate, setAccessGate] = useState<"checking" | "allowed">("checking");

  /** Only owners may add property (same as /owner/properties). */
  useEffect(() => {
    let cancelled = false;
    async function checkRole() {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.ready;
        if (!liff.isLoggedIn()) {
          if (!cancelled) setAccessGate("allowed");
          return;
        }
        const token = liff.getAccessToken();
        if (!token) {
          if (!cancelled) setAccessGate("allowed");
          return;
        }
        const res = await fetch("/api/onboarding", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as {
          onboarded?: boolean;
          role?: string;
        };
        if (cancelled) return;
        if (!data.onboarded) {
          router.replace("/onboarding");
          return;
        }
        if (data.role !== "owner") {
          if (data.role === "agent") router.replace("/agent/marketplace");
          else if (data.role === "tenant") router.replace("/tenants");
          else router.replace("/");
          return;
        }
        setAccessGate("allowed");
      } catch {
        if (!cancelled) setAccessGate("allowed");
      }
    }
    checkRole();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const toggleAmenity = (id: string) => {
    setAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };
  const filteredAmenityOptions = AMENITY_OPTIONS.filter((opt) =>
    tEdit(opt.labelKey).toLowerCase().includes(amenitySearch.toLowerCase().trim())
  );

  const handleImageClick = () => fileInputRef.current?.click();
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setImageFiles((prev) => {
      const next = [...prev, ...files].slice(0, MAX_PHOTOS);
      return next;
    });
  };
  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(false);
    setPriceError(false);
    setUploadError(null);

    const hasName = name.trim().length > 0;
    const primaryPriceInput = listingType === "sale" ? salePrice : monthlyRent;
    const hasPrice =
      primaryPriceInput.trim().length > 0 &&
      !Number.isNaN(Number(primaryPriceInput.replace(/,/g, "")));
    if (!hasName) setNameError(true);
    if (!hasPrice) setPriceError(true);
    if (!hasName || !hasPrice) return;

    setSaving(true);
    setImageDebug(null);
    let imageKeys: string[] = [];
    try {
      if (imageFiles.length > 0) {
        setUploadProgress(0);
        try {
          console.log("🎯 Uploading via proxy to Bucket (server will log bucket name)");
          const uploadData = await uploadFilesWithProgress(
            imageFiles,
            setUploadProgress
          );
          setUploadProgress(null);
          const bucketNameFromApi = uploadData.bucketName;
          const uploadedKeys = uploadData.uploads ?? [];
          imageKeys = uploadedKeys.map((u) => u.key);
          const hasUploads = uploadedKeys.length === imageFiles.length;
          setImageDebug({
            presign: {
              status: 200,
              ok: true,
              hasUploads,
            },
            puts: imageFiles.map((file, i) => ({
              index: i,
              name: file.name,
              status: 200,
              ok: true,
            })),
          });
          if (!hasUploads) {
            setUploadError(tEdit("uploadInvalidResponse"));
            setImageDebug((d) => (d ? { ...d, error: tEdit("uploadInvalidResponse") } : null));
            setSaving(false);
            return;
          }
        } catch (uploadErr) {
          setUploadProgress(null);
          const msg = uploadErr instanceof Error ? uploadErr.message : tEdit("uploadFailed");
          setUploadError(msg);
          setImageDebug({
            presign: { status: 0, ok: false },
            puts: imageFiles.map((file, i) => ({
              index: i,
              name: file.name,
              status: 0,
              ok: false,
            })),
            error: msg,
            failedAt: "upload",
            errorName: uploadErr instanceof Error ? uploadErr.constructor?.name ?? "Error" : "Unknown",
          });
          setSaving(false);
          return;
        }
      }

      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        setUploadError(tEdit("pleaseLoginToSave"));
        setSaving(false);
        return;
      }

      const numericSalePrice = Number(salePrice.replace(/,/g, "")) || 0;
      const numericMonthlyRent = Number(monthlyRent.replace(/,/g, "")) || 0;
      const payload = {
        name: name.trim(),
        type: propertyType,
        status,
        price: listingType === "sale" ? numericSalePrice : numericMonthlyRent,
        salePrice: listingType === "sale" ? numericSalePrice : undefined,
        monthlyRent:
          listingType === "rent" || saleWithTenant ? numericMonthlyRent : undefined,
        address: address.trim() || undefined,
        imageKeys,
        listingType: listingType || undefined,
        publicListing: listingType === "sale" ? true : undefined,
        saleWithTenant: listingType === "sale" ? saleWithTenant : false,
        bedrooms:
          bedroomCount > 0 ? String(bedroomCount) : undefined,
        bathrooms:
          bathroomCount > 0 ? String(bathroomCount) : undefined,
        addressPrivate: addressPrivate || undefined,
        description: description.trim() || undefined,
        squareMeters: squareMeters || undefined,
        amenities: amenities.length ? amenities : undefined,
        tenantName: tenantName.trim() || undefined,
        tenantLineId: tenantLineId.trim() || undefined,
        agentName: agentName.trim() || undefined,
        agentLineId: agentLineId.trim() || undefined,
        contractStartDate: contractStartDate.trim() || undefined,
        lineGroup: lineGroup.trim() || undefined,
        lineGroupId: lineGroupId.trim() || undefined,
        rentDueDayOfMonth: (() => {
          const n = parseInt(rentDueDayOfMonth.trim(), 10);
          return !Number.isNaN(n) && n >= 1 && n <= 31 ? n : undefined;
        })(),
      };

      const createRes = await fetch("/api/owner/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        setUploadError(createData.message ?? tEdit("saveFailedGeneric"));
        setSaving(false);
        return;
      }

      alert(tEdit("saveSuccess"));
      router.push("/owner/properties");
    } catch (err) {
      console.error("[Add Property] Upload error (full error):", err);
      const msg = err instanceof Error ? err.message : tEdit("saveFailedGeneric");
      const errName = err instanceof Error ? err.constructor?.name ?? "Error" : "Unknown";
      setUploadError(msg);
      setImageDebug((d) =>
        d
          ? { ...d, error: msg, failedAt: "request", errorName: errName }
          : { presign: { status: 0, ok: false }, puts: [], error: msg, failedAt: "request", errorName: errName }
      );
    } finally {
      setSaving(false);
    }
  };

  if (accessGate === "checking") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500 text-sm">{tCommon("loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white safe-area-top">
        <div className="flex max-w-lg mx-auto items-center gap-3 px-4 py-3">
          <Link
            href="/owner/properties"
            className="flex items-center justify-center p-2 -m-2 text-[#0F172A] hover:text-[#003366] tap-target min-h-[44px] min-w-[44px]"
            aria-label={tEdit("backAria")}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="flex-1 text-lg font-semibold text-[#0F172A] text-center -ml-12">
            {tEdit("addPageTitle")}
          </h1>
          <span className="w-10" aria-hidden />
        </div>
      </header>

      <form id="add-property-form" onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 pb-28">
        <div className="space-y-0 py-6">
          <section>
            <label className="mb-2 block text-sm font-medium text-[#0F172A]">
              {tEdit("propertyPhotos")}
            </label>
            {uploadProgress != null && (
              <div className="mb-3">
                <p className="text-sm text-slate-600 mb-1.5">{tEdit("uploadingPhotos")}</p>
                <div
                  className="w-full h-2 bg-slate-200 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full bg-[#10B981] rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleImageClick}
              disabled={imageFiles.length >= MAX_PHOTOS}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:border-[#003366] focus:outline-none focus:ring-2 focus:ring-[#003366]/20 disabled:opacity-50 disabled:pointer-events-none"
            >
              <ImagePlus className="h-10 w-10" aria-hidden />
              <span className="text-sm font-medium">
                {imageFiles.length >= MAX_PHOTOS
                  ? tEdit("maximumPhotos", { max: MAX_PHOTOS })
                  : imageFiles.length > 0
                    ? tEdit("addMorePhotos")
                    : tEdit("uploadPropertyPhotos")}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleImageChange}
              className="sr-only"
              aria-label={tEdit("choosePropertyPhotosAria")}
            />
            {imageFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {imageFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="truncate text-[#0F172A]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="shrink-0 p-1 text-slate-400 hover:text-red-500 tap-target"
                      aria-label={t("removeAmenity", { name: file.name })}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {uploadError && (
              <p className="mt-2 text-sm text-red-500" role="alert">
                {uploadError}
              </p>
            )}
            {imageDebug && (
              <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                <summary className="px-3 py-2 text-sm font-medium text-slate-600 cursor-pointer select-none">
                  Debug: Image upload
                </summary>
                <pre className="p-3 text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap break-words border-t border-slate-200">
                  {JSON.stringify(
                    {
                      presign: imageDebug.presign,
                      puts: imageDebug.puts,
                      error: imageDebug.error,
                      failedAt: imageDebug.failedAt,
                      errorName: imageDebug.errorName,
                    },
                    null,
                    2
                  )}
                </pre>
                {imageDebug.errorName && imageDebug.error === "Load failed" && (
                  <p className="px-3 pb-3 text-xs text-amber-700 border-t border-slate-200 pt-2">
                    “Load failed” usually means the browser blocked the request (e.g. S3 CORS). Add CORS on your bucket: allow your app origin and PUT method.
                  </p>
                )}
              </details>
            )}
          </section>

          <section className={formSectionClass}>
            <label htmlFor="listing-type" className="mb-1 block text-sm font-medium text-[#0F172A]">
              {tEdit("homesSaleOrRent")}
            </label>
            <select
              id="listing-type"
              value={listingType}
              onChange={(e) => {
                const nextListingType = e.target.value as "sale" | "rent";
                setListingType(nextListingType);
                if (nextListingType !== "sale") setSaleWithTenant(false);
              }}
              className={`${inputBase} border-b border-slate-200 cursor-pointer`}
            >
              {LISTING_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {tEdit(opt.labelKey)}
                </option>
              ))}
            </select>
            {listingType === "sale" && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <label htmlFor="sale-with-tenant" className="block text-sm font-medium text-[#0F172A]">
                      {tEdit("saleWithTenant")}
                    </label>
                    <p className="mt-1 text-sm text-slate-500">
                      {tEdit("saleWithTenantDescription")}
                    </p>
                  </div>
                  <button
                    id="sale-with-tenant"
                    type="button"
                    role="switch"
                    aria-checked={saleWithTenant}
                    onClick={() =>
                      setSaleWithTenant((prev) => {
                        const next = !prev;
                        if (next) setStatus("Occupied");
                        return next;
                      })
                    }
                    className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#003366]/20 tap-target ${
                      saleWithTenant
                        ? "border-[#003366] bg-[#003366]"
                        : "bg-slate-100"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        saleWithTenant ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                {status !== "Occupied" && (
                  <p className="mt-3 text-xs text-amber-700">
                    {tEdit("saleWithTenantNoTenantHint")}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className={`space-y-4 ${formSectionClass}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F172A]">
              {tEdit("basicInfo")}
            </h2>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#0F172A] mb-1">
                {tEdit("propertyName")}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(false);
                }}
                placeholder={tEdit("propertyNamePlaceholder")}
                className={`${inputBase} ${nameError ? inputError : ""}`}
                aria-invalid={nameError}
                aria-describedby={nameError ? "name-error" : undefined}
              />
              {nameError && (
                <p id="name-error" className="mt-1 text-sm text-red-500" role="alert">
                  {tEdit("propertyNameRequired")}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-[#0F172A] mb-1">
                {tEdit("propertyType")}
              </label>
              <select
                id="type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className={`${inputBase} border-b border-slate-200 cursor-pointer`}
              >
                {PROPERTY_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {tEdit(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="primary-price" className="block text-sm font-medium text-[#0F172A] mb-1">
                {listingType === "sale" ? tEdit("salePrice") : tEdit("monthlyRent")}
              </label>
              <div className="flex items-center border-b border-slate-200 focus-within:border-[#003366]">
                <span className="text-base text-slate-500 mr-2">฿</span>
                <input
                  id="primary-price"
                  type="text"
                  inputMode="numeric"
                  value={listingType === "sale" ? salePrice : monthlyRent}
                  onChange={(e) => {
                    const nextValue = e.target.value.replace(/\D/g, "");
                    if (listingType === "sale") setSalePrice(nextValue);
                    else setMonthlyRent(nextValue);
                    setPriceError(false);
                  }}
                  placeholder="0"
                  className={`flex-1 bg-transparent py-3 text-base text-[#0F172A] placeholder:text-slate-400 focus:outline-none ${priceError ? "border-red-500" : ""}`}
                  aria-invalid={priceError}
                  aria-describedby={priceError ? "price-error" : undefined}
                />
              </div>
              {priceError && (
                <p id="price-error" className="mt-1 text-sm text-red-500" role="alert">
                  {listingType === "sale"
                    ? tEdit("salePriceRequired")
                    : tEdit("monthlyRentRequired")}
                </p>
              )}
            </div>
            {listingType === "sale" && saleWithTenant && (
              <div>
                <label htmlFor="current-monthly-rent" className="block text-sm font-medium text-[#0F172A] mb-1">
                  {tEdit("currentMonthlyRent")}
                </label>
                <div className="flex items-center border-b border-slate-200 focus-within:border-[#003366]">
                  <span className="text-base text-slate-500 mr-2">฿</span>
                  <input
                    id="current-monthly-rent"
                    type="text"
                    inputMode="numeric"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="flex-1 bg-transparent py-3 text-base text-[#0F172A] placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {tEdit("currentMonthlyRentHint")}
                </p>
              </div>
            )}
          </section>

          <section className={`space-y-4 ${formSectionClass}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F172A]">
              {tEdit("details")}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-center text-sm font-medium text-[#0F172A]">
                  {t("bedrooms")}
                </span>
                <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-1 py-2">
                  <button
                    type="button"
                    className={stepperBtnClass}
                    disabled={bedroomCount <= 0}
                    onClick={() =>
                      setBedroomCount((n) => Math.max(0, n - 1))
                    }
                    aria-label={`${tEdit("stepperMinusAria")} — ${t("bedrooms")}`}
                  >
                    <Minus className="h-5 w-5" aria-hidden />
                  </button>
                  <span
                    className="min-w-[2.25rem] text-center text-lg font-semibold tabular-nums text-[#0F172A]"
                    aria-live="polite"
                  >
                    {bedroomCount}
                  </span>
                  <button
                    type="button"
                    className={stepperBtnClass}
                    disabled={bedroomCount >= ROOM_STEPPER_MAX}
                    onClick={() =>
                      setBedroomCount((n) =>
                        Math.min(ROOM_STEPPER_MAX, n + 1)
                      )
                    }
                    aria-label={`${tEdit("stepperPlusAria")} — ${t("bedrooms")}`}
                  >
                    <Plus className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-center text-sm font-medium text-[#0F172A]">
                  {t("bathrooms")}
                </span>
                <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-1 py-2">
                  <button
                    type="button"
                    className={stepperBtnClass}
                    disabled={bathroomCount <= 0}
                    onClick={() =>
                      setBathroomCount((n) => Math.max(0, n - 1))
                    }
                    aria-label={`${tEdit("stepperMinusAria")} — ${t("bathrooms")}`}
                  >
                    <Minus className="h-5 w-5" aria-hidden />
                  </button>
                  <span
                    className="min-w-[2.25rem] text-center text-lg font-semibold tabular-nums text-[#0F172A]"
                    aria-live="polite"
                  >
                    {bathroomCount}
                  </span>
                  <button
                    type="button"
                    className={stepperBtnClass}
                    disabled={bathroomCount >= ROOM_STEPPER_MAX}
                    onClick={() =>
                      setBathroomCount((n) =>
                        Math.min(ROOM_STEPPER_MAX, n + 1)
                      )
                    }
                    aria-label={`${tEdit("stepperPlusAria")} — ${t("bathrooms")}`}
                  >
                    <Plus className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className={formSectionClass}>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-[#0F172A]">
              {tEdit("propertyDescription")}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tEdit("propertyDescriptionPlaceholder")}
              rows={4}
              className={`${inputBase} resize-none border border-slate-200 rounded-lg px-3 focus:border-[#003366]`}
            />
          </section>

          <section className={`space-y-5 ${formSectionClass}`}>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F172A]">
                {tEdit("advancedDetails")}
              </h2>
              <p className="mt-1 text-xs text-slate-500">{tEdit("optional")}</p>
            </div>

            <div className={advancedCardClass}>
              <h3 className={advancedCardTitleClass}>
                {tEdit("additionalInfoAddressBlock")}
              </h3>
              <div>
                <label htmlFor="address" className="mb-1 block text-sm font-medium text-[#0F172A]">
                  <span>{tEdit("address")}</span>
                  <span className="font-normal text-slate-500">
                    {" "}
                    · {tEdit("optional")}
                  </span>
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={tEdit("addressPlaceholder")}
                  rows={3}
                  className={`${inputBase} resize-none rounded-lg border border-slate-200 px-3 focus:border-[#003366]`}
                />
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="address-private"
                    className="text-sm font-medium text-[#0F172A]"
                  >
                    {tEdit("keepAddressPrivate")}
                  </label>
                  <button
                    id="address-private"
                    type="button"
                    role="switch"
                    aria-checked={addressPrivate}
                    onClick={() => setAddressPrivate((prev) => !prev)}
                    className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#003366]/20 tap-target ${
                      addressPrivate
                        ? "border-[#003366] bg-[#003366]"
                        : "bg-slate-100"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        addressPrivate ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {tEdit("addressPrivateDescription")}
                </p>
              </div>
            </div>

            <div className={advancedCardClass}>
              <h3 className={advancedCardTitleClass}>
                {tEdit("additionalInfoAreaBlock")}
              </h3>
              <div>
                <label
                  htmlFor="square-meters"
                  className="mb-1 block text-sm font-medium text-[#0F172A]"
                >
                  {tEdit("squareMeters")}
                </label>
                <input
                  id="square-meters"
                  type="text"
                  inputMode="decimal"
                  value={squareMeters}
                  onChange={(e) =>
                    setSquareMeters(e.target.value.replace(/[^\d.]/g, ""))
                  }
                  placeholder={tEdit("squareMetersPlaceholder")}
                  className={`${inputBase} rounded-lg border border-slate-200 px-3`}
                />
                <p className="mt-1 text-xs text-slate-500">{tEdit("optional")}</p>
              </div>
            </div>
          </section>

          <section className={`space-y-4 ${formSectionClass}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F172A]">
              {t("amenities")}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden />
              <input
                type="search"
                value={amenitySearch}
                onChange={(e) => setAmenitySearch(e.target.value)}
                placeholder={tEdit("searchAmenities")}
                className={`${inputBase} pl-9 border border-slate-200 rounded-lg focus:border-[#003366]`}
                aria-label={tEdit("searchAmenitiesAria")}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredAmenityOptions.map((opt) => {
                const selected = amenities.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleAmenity(opt.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors tap-target min-h-[44px] ${
                      selected
                        ? "bg-[#003366] text-white border border-[#003366]"
                        : "bg-white text-[#0F172A] border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {selected ? (
                      <Check className="h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                    <span>{tEdit(opt.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={formSectionClass}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#0F172A]">
              {tEdit("rentalStatus")}
            </h2>
            <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50/50">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatus(opt)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors tap-target min-h-[44px] ${
                    status === opt
                      ? "bg-[#003366] text-white"
                      : "text-slate-600 hover:text-[#0F172A]"
                  }`}
                >
                  {tProps(`status.${opt}`)}
                </button>
              ))}
            </div>
          </section>

          {status === "Occupied" && (
            <section className={`space-y-6 ${formSectionClass}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F172A]">
                {tEdit("residentDetails")}
              </h2>

              {/* Tenant section */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-4">
                <h3 className="text-sm font-medium text-[#0F172A]">{t("tenantSection")}</h3>
                <div>
                  <label htmlFor="tenant" className="block text-sm font-medium text-[#0F172A] mb-1">
                    {tEdit("tenantName")}
                  </label>
                  <input
                    id="tenant"
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder={tEdit("tenantNamePlaceholder2")}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                  />
                </div>
                <div>
                  <label htmlFor="tenant-line-id" className="block text-sm text-slate-500 mb-1">
                    {tEdit("lineIdOptional")}
                  </label>
                  <input
                    id="tenant-line-id"
                    type="text"
                    value={tenantLineId}
                    onChange={(e) => setTenantLineId(e.target.value)}
                    placeholder={tEdit("pasteTenantLineId")}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                  />
                </div>
              </div>

              {/* Agent section */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-4">
                <h3 className="text-sm font-medium text-[#0F172A]">{t("agentSection")}</h3>
                <div>
                  <label htmlFor="agent" className="block text-sm text-slate-500 mb-1">
                    {tEdit("agentNameOptional")}
                  </label>
                  <input
                    id="agent"
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder={t("agentPlaceholder")}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                  />
                </div>
                <div>
                  <label htmlFor="agent-line-id" className="block text-sm text-slate-500 mb-1">
                    {tEdit("lineIdOptional")}
                  </label>
                  <input
                    id="agent-line-id"
                    type="text"
                    value={agentLineId}
                    onChange={(e) => setAgentLineId(e.target.value)}
                    placeholder={tEdit("pasteAgentLineId")}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                  />
                </div>
                <div>
                  <label htmlFor="line-group" className="block text-sm text-slate-500 mb-1">
                    {tEdit("lineGroupOptional")}
                  </label>
                  <input
                    id="line-group"
                    type="text"
                    value={lineGroup}
                    onChange={(e) => setLineGroup(e.target.value)}
                    placeholder={tEdit("lineGroupPlaceholder")}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                  />
                </div>
                <div>
                  <label htmlFor="line-group-id" className="block text-sm text-slate-500 mb-1">
                    {tEdit("lineGroupIdOptional")}
                  </label>
                  <input
                    id="line-group-id"
                    type="text"
                    value={lineGroupId}
                    onChange={(e) => setLineGroupId(e.target.value)}
                    placeholder={tEdit("lineGroupIdPlaceholder")}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3 font-mono text-sm`}
                  />
                  <p className="mt-1 text-xs text-slate-500">{tEdit("lineGroupIdHintShort")}</p>
                </div>
                <div>
                  <label htmlFor="rent-due-day" className="block text-sm text-slate-500 mb-1">
                    {tEdit("rentDueDayOptional")}
                  </label>
                  <input
                    id="rent-due-day"
                    type="number"
                    min={1}
                    max={31}
                    inputMode="numeric"
                    value={rentDueDayOfMonth}
                    onChange={(e) => setRentDueDayOfMonth(e.target.value)}
                    placeholder={tEdit("rentDueDayPlaceholder")}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contract-start-date" className="block text-sm font-medium text-[#0F172A] mb-1">
                  {tEdit("contractStartOptional")}
                </label>
                <input
                  id="contract-start-date"
                  type="date"
                  value={contractStartDate}
                  onChange={(e) => setContractStartDate(e.target.value)}
                  className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                />
              </div>
            </section>
          )}
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-30 max-w-lg mx-auto safe-area-bottom bg-white border-t border-slate-100 p-4">
        <Button
          type="submit"
          form="add-property-form"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={saving}
          isLoading={saving}
        >
          {tEdit("save")}
        </Button>
      </div>
    </div>
  );
}
