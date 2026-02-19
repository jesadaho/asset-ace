"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  MessageCircle,
  X,
  Search,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { uploadFilesWithProgress } from "@/lib/uploadWithProgress";

const MAX_PHOTOS = 10;

const LISTING_TYPES = [
  { value: "rent", label: "For rent" },
  { value: "sale", label: "For sale" },
];

const PROPERTY_TYPES = [
  { value: "Condo", label: "Condo" },
  { value: "House", label: "House" },
  { value: "Apartment", label: "Apartment" },
];

const AMENITY_OPTIONS = [
  { id: "balcony", label: "Balcony" },
  { id: "basement", label: "Basement" },
  { id: "bike-parking", label: "Bike Parking" },
  { id: "cable-tv", label: "Cable TV" },
  { id: "pool", label: "Pool" },
  { id: "gym", label: "Gym" },
  { id: "parking", label: "Parking" },
  { id: "garden", label: "Garden" },
  { id: "security", label: "Security" },
  { id: "elevator", label: "Elevator" },
  { id: "wifi", label: "WiFi" },
  { id: "air-conditioning", label: "Air Conditioning" },
];

const STATUS_OPTIONS = ["Available", "Occupied", "Maintenance"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

const inputBase =
  "w-full rounded-lg border-b border-slate-200 bg-white px-0 py-3 text-base text-[#0F172A] placeholder:text-slate-400 transition-colors focus:border-[#003366] focus:outline-none focus:ring-0 tap-target min-h-[44px]";
const inputError = "border-red-500 focus:border-red-500";

type PropertyData = {
  id: string;
  name: string;
  type: string;
  status: Status;
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
  tenantLineId?: string;
  agentName?: string;
  agentLineId?: string;
};

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [listingType, setListingType] = useState<"sale" | "rent">("rent");
  const [propertyType, setPropertyType] = useState("Condo");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [address, setAddress] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
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
  const [lineSelectMessage, setLineSelectMessage] = useState<string | null>(null);
  const [existingImageKeys, setExistingImageKeys] = useState<string[]>([]);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [nameError, setNameError] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setLoadError("Invalid property");
      return;
    }
    let cancelled = false;
    async function fetchProperty() {
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (!token) {
          if (!cancelled) setLoadError("Please log in with LINE.");
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/owner/properties/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.status === 401) {
          setLoadError("Please log in with LINE.");
          setLoading(false);
          return;
        }
        if (res.status === 404) {
          setLoadError("Property not found.");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setLoadError(data.message ?? `Failed to load property (${res.status})`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        const p: PropertyData = data.property;
        if (!p) {
          setLoadError("Invalid response.");
          setLoading(false);
          return;
        }
        setName(p.name ?? "");
        setListingType((p.listingType === "sale" ? "sale" : "rent") as "sale" | "rent");
        setPropertyType(p.type ?? "Condo");
        setMonthlyRent(String(p.price ?? ""));
        setAddress(p.address ?? "");
        setBedrooms(p.bedrooms ?? "");
        setBathrooms(p.bathrooms ?? "");
        setAddressPrivate(p.addressPrivate ?? false);
        setDescription(p.description ?? "");
        setSquareMeters(p.squareMeters ?? "");
        setAmenities(Array.isArray(p.amenities) ? p.amenities : []);
        setStatus((STATUS_OPTIONS.includes(p.status as Status) ? p.status : "Available") as Status);
        setTenantName(p.tenantName ?? "");
        setTenantLineId(p.tenantLineId ?? "");
        setAgentName(p.agentName ?? "");
        setAgentLineId(p.agentLineId ?? "");
        setExistingImageKeys(Array.isArray(p.imageKeys) ? p.imageKeys : []);
        setExistingImageUrl(p.imageUrl ?? null);
        setLoadError(null);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load property");
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

  const toggleAmenity = (id: string) => {
    setAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };
  const filteredAmenityOptions = AMENITY_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(amenitySearch.toLowerCase().trim())
  );

  const maxNewPhotos = Math.max(0, MAX_PHOTOS - existingImageKeys.length);
  const handleImageClick = () => fileInputRef.current?.click();
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setImageFiles((prev) => {
      const next = [...prev, ...files].slice(0, maxNewPhotos);
      return next;
    });
  };
  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageKeys((prev) => prev.filter((_, i) => i !== index));
    if (index === 0) setExistingImageUrl(null);
  };

  const handleLineSelect = async (field: "tenant" | "agent") => {
    const liff = (await import("@line/liff")).default;
    const isAvailable =
      typeof liff.isApiAvailable === "function" &&
      liff.isApiAvailable("shareTargetPicker");
    if (!isAvailable || typeof liff.shareTargetPicker !== "function") {
      setLineSelectMessage(
        "Send invite is only available in the LINE app. You can still enter their name and LINE ID below."
      );
      return;
    }
    const inviteUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID ?? ""}`;
    const label = field === "tenant" ? "tenant" : "agent";
    const inviteText = inviteUrl
      ? `You're invited as ${label} for a property. Open this link: ${inviteUrl}`
      : `You're invited as ${label} for a property.`;
    try {
      const result = await liff.shareTargetPicker(
        [{ type: "text", text: inviteText }],
        { isMultiple: false }
      );
      if (result?.status === "success") {
        setLineSelectMessage(
          "Invite link sent. You can still enter their name and LINE ID below if you have it."
        );
      }
      // Cancel: Promise resolves with no value; no intrusive message
    } catch {
      setLineSelectMessage(
        "Could not send invite. Check that Share target picker is enabled for this LIFF app. You can still enter their name and LINE ID below."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(false);
    setPriceError(false);
    setUploadError(null);

    const hasName = name.trim().length > 0;
    const hasPrice =
      monthlyRent.trim().length > 0 &&
      !Number.isNaN(Number(monthlyRent.replace(/,/g, "")));
    if (!hasName) setNameError(true);
    if (!hasPrice) setPriceError(true);
    if (!hasName || !hasPrice) return;

    setSaving(true);
    let newKeys: string[] = [];
    try {
      if (imageFiles.length > 0) {
        setUploadProgress(0);
        try {
          const uploadData = await uploadFilesWithProgress(
            imageFiles,
            setUploadProgress
          );
          setUploadProgress(null);
          const uploadedKeys = uploadData.uploads ?? [];
          newKeys = uploadedKeys.map((u) => u.key);
          if (uploadedKeys.length !== imageFiles.length) {
            setUploadError("Invalid upload response");
            setSaving(false);
            return;
          }
        } catch (uploadErr) {
          setUploadProgress(null);
          setUploadError(
            uploadErr instanceof Error ? uploadErr.message : "Upload failed"
          );
          setSaving(false);
          return;
        }
      }

      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        setUploadError("Please log in with LINE to save.");
        setSaving(false);
        return;
      }

      const imageKeys = [...existingImageKeys, ...newKeys];
      const price = Number(monthlyRent.replace(/,/g, "")) || 0;
      const payload = {
        name: name.trim(),
        type: propertyType,
        status,
        price,
        address: address.trim(),
        imageKeys,
        listingType: listingType || undefined,
        bedrooms: bedrooms || undefined,
        bathrooms: bathrooms || undefined,
        addressPrivate: addressPrivate || undefined,
        description: description.trim() || undefined,
        squareMeters: squareMeters || undefined,
        amenities: amenities.length ? amenities : undefined,
        tenantName: tenantName.trim() || undefined,
        tenantLineId: tenantLineId.trim() || undefined,
        agentName: agentName.trim() || undefined,
        agentLineId: agentLineId.trim() || undefined,
      };

      const patchRes = await fetch(`/api/owner/properties/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const patchData = await patchRes.json().catch(() => ({}));
      if (!patchRes.ok) {
        setUploadError(
          patchData.message ?? `Failed to save (${patchRes.status})`
        );
        setSaving(false);
        return;
      }

      router.push(`/owner/properties/${id}`);
    } catch (err) {
      console.error("[Edit Property]", err);
      setUploadError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading property...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-white p-4">
        <Link
          href={id ? `/owner/properties/${id}` : "/owner/properties"}
          className="inline-flex items-center gap-2 text-[#0F172A] hover:text-[#003366] text-sm font-medium"
        >
          Back
        </Link>
        <p className="mt-4 text-red-500 text-sm" role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white safe-area-top">
        <div className="flex max-w-lg mx-auto items-center gap-3 px-4 py-3">
          <Link
            href={`/owner/properties/${id}`}
            className="flex items-center justify-center p-2 -m-2 text-[#0F172A] hover:text-[#003366] tap-target min-h-[44px] min-w-[44px]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="flex-1 text-lg font-semibold text-[#0F172A] text-center -ml-12">
            Edit Property
          </h1>
          <span className="w-10" aria-hidden />
        </div>
      </header>

      <form
        id="edit-property-form"
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto px-4 pb-28"
      >
        <div className="py-6 space-y-8">
          <section>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              Property Photos
            </label>
            {uploadProgress != null && (
              <div className="mb-3">
                <p className="text-sm text-slate-600 mb-1.5">Uploading photos…</p>
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
            {existingImageKeys.length > 0 && (
              <ul className="mb-3 space-y-2">
                {existingImageKeys.map((_key, index) => (
                  <li
                    key={`existing-${index}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white overflow-hidden"
                  >
                    {index === 0 && existingImageUrl ? (
                      <div className="relative w-20 h-20 shrink-0 bg-slate-200">
                        <img
                          src={existingImageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 shrink-0 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        Photo {index + 1}
                      </div>
                    )}
                    <span className="flex-1 text-sm text-slate-600 truncate">
                      Existing photo {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="shrink-0 p-2 text-slate-400 hover:text-red-500 tap-target"
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={handleImageClick}
              disabled={imageFiles.length >= maxNewPhotos}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:border-[#003366] focus:outline-none focus:ring-2 focus:ring-[#003366]/20 disabled:opacity-50 disabled:pointer-events-none"
            >
              <ImagePlus className="h-10 w-10" aria-hidden />
              <span className="text-sm font-medium">
                {imageFiles.length >= maxNewPhotos
                  ? `Maximum ${maxNewPhotos} more photo(s)`
                  : imageFiles.length > 0
                    ? "Add more photos"
                    : "Add more photos"}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleImageChange}
              className="sr-only"
              aria-label="Choose property photos"
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
                      aria-label={`Remove ${file.name}`}
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
          </section>

          <section>
            <label
              htmlFor="edit-listing-type"
              className="block text-sm font-medium text-[#0F172A] mb-1"
            >
              Homes for sale or rent
            </label>
            <select
              id="edit-listing-type"
              value={listingType}
              onChange={(e) =>
                setListingType(e.target.value as "sale" | "rent")
              }
              className={`${inputBase} border-b border-slate-200 cursor-pointer`}
            >
              {LISTING_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
              Basic Info
            </h2>
            <div>
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                Property Name
              </label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(false);
                }}
                placeholder="Enter property name"
                className={`${inputBase} ${nameError ? inputError : ""}`}
                aria-invalid={nameError}
                aria-describedby={nameError ? "edit-name-error" : undefined}
              />
              {nameError && (
                <p
                  id="edit-name-error"
                  className="mt-1 text-sm text-red-500"
                  role="alert"
                >
                  Property name is required
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="edit-type"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                Property Type
              </label>
              <select
                id="edit-type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className={`${inputBase} border-b border-slate-200 cursor-pointer`}
              >
                {PROPERTY_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="edit-rent"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                Monthly Rent
              </label>
              <div className="flex items-center border-b border-slate-200 focus-within:border-[#003366]">
                <span className="text-base text-slate-500 mr-2">฿</span>
                <input
                  id="edit-rent"
                  type="text"
                  inputMode="numeric"
                  value={monthlyRent}
                  onChange={(e) => {
                    setMonthlyRent(e.target.value.replace(/\D/g, ""));
                    setPriceError(false);
                  }}
                  placeholder="0"
                  className={`flex-1 bg-transparent py-3 text-base text-[#0F172A] placeholder:text-slate-400 focus:outline-none ${priceError ? "border-red-500" : ""}`}
                  aria-invalid={priceError}
                  aria-describedby={priceError ? "edit-price-error" : undefined}
                />
              </div>
              {priceError && (
                <p
                  id="edit-price-error"
                  className="mt-1 text-sm text-red-500"
                  role="alert"
                >
                  Monthly rent is required
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="edit-address"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                Address
              </label>
              <textarea
                id="edit-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter full address"
                rows={3}
                className={`${inputBase} resize-none border border-slate-200 rounded-lg px-3 focus:border-[#003366]`}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
              Details
            </h2>
            <div>
              <label
                htmlFor="edit-bedrooms"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                Bedrooms
              </label>
              <input
                id="edit-bedrooms"
                type="text"
                inputMode="numeric"
                value={bedrooms}
                onChange={(e) =>
                  setBedrooms(e.target.value.replace(/\D/g, ""))
                }
                placeholder="e.g. 2"
                className={`${inputBase} border border-slate-200 rounded-lg px-3`}
              />
            </div>
            <div>
              <label
                htmlFor="edit-bathrooms"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                Bathrooms
              </label>
              <input
                id="edit-bathrooms"
                type="text"
                inputMode="numeric"
                value={bathrooms}
                onChange={(e) =>
                  setBathrooms(e.target.value.replace(/\D/g, ""))
                }
                placeholder="e.g. 1"
                className={`${inputBase} border border-slate-200 rounded-lg px-3`}
              />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="edit-address-private"
                className="text-sm font-medium text-[#0F172A]"
              >
                Keep property address private
              </label>
              <button
                id="edit-address-private"
                type="button"
                role="switch"
                aria-checked={addressPrivate}
                onClick={() => setAddressPrivate((prev) => !prev)}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#003366]/20 tap-target ${
                  addressPrivate
                    ? "bg-[#003366] border-[#003366]"
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
            <p className="mt-1.5 text-sm text-slate-500">
              We won&apos;t show the exact address. The exact address helps us
              verify and list your property.
            </p>
          </section>

          <section>
            <label
              htmlFor="edit-description"
              className="block text-sm font-medium text-[#0F172A] mb-1"
            >
              Property description
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your property..."
              rows={4}
              className={`${inputBase} resize-none border border-slate-200 rounded-lg px-3 focus:border-[#003366]`}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide flex items-center gap-2">
              Advanced Details
              <span className="text-xs font-normal normal-case text-slate-500">
                Optional
              </span>
            </h2>
            <div>
              <label
                htmlFor="edit-square-meters"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                Square meters
              </label>
              <input
                id="edit-square-meters"
                type="text"
                inputMode="decimal"
                value={squareMeters}
                onChange={(e) =>
                  setSquareMeters(e.target.value.replace(/[^\d.]/g, ""))
                }
                placeholder="e.g. 85"
                className={`${inputBase} border border-slate-200 rounded-lg px-3`}
              />
              <p className="mt-1 text-xs text-slate-500">Optional</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
              Amenities
            </h2>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                aria-hidden
              />
              <input
                type="search"
                value={amenitySearch}
                onChange={(e) => setAmenitySearch(e.target.value)}
                placeholder="Search amenities..."
                className={`${inputBase} pl-9 border border-slate-200 rounded-lg focus:border-[#003366]`}
                aria-label="Search amenities"
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
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide mb-3">
              Rental Status
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
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {status === "Occupied" && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
                Resident Details
              </h2>
              {lineSelectMessage && (
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                  {lineSelectMessage}
                  <button
                    type="button"
                    onClick={() => setLineSelectMessage(null)}
                    className="ml-2 text-[#003366] font-medium"
                  >
                    Dismiss
                  </button>
                </p>
              )}
              <div>
                <label
                  htmlFor="edit-tenant"
                  className="block text-sm font-medium text-[#0F172A] mb-1"
                >
                  Tenant Name
                </label>
                <div className="flex gap-2">
                  <input
                    id="edit-tenant"
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Enter tenant name"
                    className={`${inputBase} flex-1 border border-slate-200 rounded-lg px-3`}
                  />
                  <button
                    type="button"
                    onClick={() => handleLineSelect("tenant")}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#06C755] px-4 text-sm font-medium text-white hover:bg-[#05b34a] tap-target min-h-[44px] shrink-0"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden />
                    <span className="hidden sm:inline">Send Invite Link to Tenant</span>
                  </button>
                </div>
                <label
                  htmlFor="edit-tenant-line-id"
                  className="block text-sm text-slate-500 mt-1 mb-0.5"
                >
                  LINE ID (optional)
                </label>
                <input
                  id="edit-tenant-line-id"
                  type="text"
                  value={tenantLineId}
                  onChange={(e) => setTenantLineId(e.target.value)}
                  placeholder="Paste tenant LINE user ID"
                  className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-agent"
                  className="block text-sm font-medium text-[#0F172A] mb-1"
                >
                  Agent Name
                </label>
                <div className="flex gap-2">
                  <input
                    id="edit-agent"
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Enter agent name"
                    className={`${inputBase} flex-1 border border-slate-200 rounded-lg px-3`}
                  />
                  <button
                    type="button"
                    onClick={() => handleLineSelect("agent")}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#06C755] px-4 text-sm font-medium text-white hover:bg-[#05b34a] tap-target min-h-[44px] shrink-0"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden />
                    <span className="hidden sm:inline">Send Invite Link to Agent</span>
                  </button>
                </div>
                <label
                  htmlFor="edit-agent-line-id"
                  className="block text-sm text-slate-500 mt-1 mb-0.5"
                >
                  LINE ID (optional)
                </label>
                <input
                  id="edit-agent-line-id"
                  type="text"
                  value={agentLineId}
                  onChange={(e) => setAgentLineId(e.target.value)}
                  placeholder="Paste agent LINE user ID"
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
          form="edit-property-form"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={saving}
          isLoading={saving}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
