"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  MessageCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const MAX_PHOTOS = 10;

const PROPERTY_TYPES = [
  { value: "Condo", label: "Condo" },
  { value: "House", label: "House" },
  { value: "Apartment", label: "Apartment" },
];

const STATUS_OPTIONS = ["Available", "Occupied", "Maintenance"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

const inputBase =
  "w-full rounded-lg border-b border-slate-200 bg-white px-0 py-3 text-base text-[#0F172A] placeholder:text-slate-400 transition-colors focus:border-[#003366] focus:outline-none focus:ring-0 tap-target min-h-[44px]";
const inputError = "border-red-500 focus:border-red-500";

export default function AddPropertyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [propertyType, setPropertyType] = useState("Condo");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<Status>("Available");
  const [tenantName, setTenantName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [nameError, setNameError] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handleLineSelect = () => {
    alert("Connecting to LIFF Friend Picker...");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(false);
    setPriceError(false);
    setUploadError(null);

    const hasName = name.trim().length > 0;
    const hasPrice = monthlyRent.trim().length > 0 && !Number.isNaN(Number(monthlyRent.replace(/,/g, "")));
    if (!hasName) setNameError(true);
    if (!hasPrice) setPriceError(true);
    if (!hasName || !hasPrice) return;

    setSaving(true);
    try {
      if (imageFiles.length > 0) {
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: imageFiles.map((f) => ({ name: f.name, type: f.type })),
          }),
        });
        const presignData = await presignRes.json().catch(() => ({}));
        if (!presignRes.ok) {
          setUploadError(presignData.error || `Upload setup failed (${presignRes.status})`);
          setSaving(false);
          return;
        }
        const uploads = presignData.uploads as Array<{ key: string; url: string }>;
        if (!Array.isArray(uploads) || uploads.length !== imageFiles.length) {
          setUploadError("Invalid presign response");
          setSaving(false);
          return;
        }
        for (let i = 0; i < imageFiles.length; i++) {
          const putRes = await fetch(uploads[i].url, {
            method: "PUT",
            body: imageFiles[i],
            headers: { "Content-Type": imageFiles[i].type || "image/jpeg" },
          });
          if (!putRes.ok) {
            setUploadError(`Failed to upload ${imageFiles[i].name}`);
            setSaving(false);
            return;
          }
        }
      }
      alert("Property saved.");
      router.push("/owner/properties");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white safe-area-top">
        <div className="flex max-w-lg mx-auto items-center gap-3 px-4 py-3">
          <Link
            href="/owner/properties"
            className="flex items-center justify-center p-2 -m-2 text-[#0F172A] hover:text-[#003366] tap-target min-h-[44px] min-w-[44px]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="flex-1 text-lg font-semibold text-[#0F172A] text-center -ml-12">
            Add New Property
          </h1>
          <span className="w-10" aria-hidden />
        </div>
      </header>

      <form id="add-property-form" onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 pb-28">
        <div className="py-6 space-y-8">
          <section>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              Property Photos
            </label>
            <button
              type="button"
              onClick={handleImageClick}
              disabled={imageFiles.length >= MAX_PHOTOS}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:border-[#003366] focus:outline-none focus:ring-2 focus:ring-[#003366]/20 disabled:opacity-50 disabled:pointer-events-none"
            >
              <ImagePlus className="h-10 w-10" aria-hidden />
              <span className="text-sm font-medium">
                {imageFiles.length >= MAX_PHOTOS
                  ? `Maximum ${MAX_PHOTOS} photos`
                  : imageFiles.length > 0
                    ? "Add more photos"
                    : "Upload Property Photos"}
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

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
              Basic Info
            </h2>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#0F172A] mb-1">
                Property Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(false);
                }}
                placeholder="Enter property name"
                className={`${inputBase} ${nameError ? inputError : ""}`}
                aria-invalid={nameError}
                aria-describedby={nameError ? "name-error" : undefined}
              />
              {nameError && (
                <p id="name-error" className="mt-1 text-sm text-red-500" role="alert">
                  Property name is required
                </p>
              )}
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-[#0F172A] mb-1">
                Property Type
              </label>
              <select
                id="type"
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
              <label htmlFor="rent" className="block text-sm font-medium text-[#0F172A] mb-1">
                Monthly Rent
              </label>
              <div className="flex items-center border-b border-slate-200 focus-within:border-[#003366]">
                <span className="text-base text-slate-500 mr-2">฿</span>
                <input
                  id="rent"
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
                  aria-describedby={priceError ? "price-error" : undefined}
                />
              </div>
              {priceError && (
                <p id="price-error" className="mt-1 text-sm text-red-500" role="alert">
                  Monthly rent is required
                </p>
              )}
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-[#0F172A] mb-1">
                Address
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter full address"
                rows={3}
                className={`${inputBase} resize-none border border-slate-200 rounded-lg px-3 focus:border-[#003366]`}
              />
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
              <div>
                <label htmlFor="tenant" className="block text-sm font-medium text-[#0F172A] mb-1">
                  Tenant Name
                </label>
                <div className="flex gap-2">
                  <input
                    id="tenant"
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Enter tenant name"
                    className={`${inputBase} flex-1 border border-slate-200 rounded-lg px-3`}
                  />
                  <button
                    type="button"
                    onClick={handleLineSelect}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#06C755] px-4 text-sm font-medium text-white hover:bg-[#05b34a] tap-target min-h-[44px] shrink-0"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden />
                    <span className="hidden sm:inline">Select from LINE</span>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="agent" className="block text-sm font-medium text-[#0F172A] mb-1">
                  Agent Name
                </label>
                <div className="flex gap-2">
                  <input
                    id="agent"
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Enter agent name"
                    className={`${inputBase} flex-1 border border-slate-200 rounded-lg px-3`}
                  />
                  <button
                    type="button"
                    onClick={handleLineSelect}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#06C755] px-4 text-sm font-medium text-white hover:bg-[#05b34a] tap-target min-h-[44px] shrink-0"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden />
                    <span className="hidden sm:inline">Select from LINE</span>
                  </button>
                </div>
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
          Save Property
        </Button>
      </div>
    </div>
  );
}
