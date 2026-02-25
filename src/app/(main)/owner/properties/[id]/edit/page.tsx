"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  X,
  Search,
  Plus,
  Check,
  Copy,
  Download,
  ExternalLink,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { uploadFilesWithProgress } from "@/lib/uploadWithProgress";
import { useToast } from "@/components/ui/Toast";
import { useTranslations } from "next-intl";

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

const AMENITY_OPTIONS = [
  { id: "balcony", labelKey: "amenityBalcony" as const },
  { id: "basement", labelKey: "amenityBasement" as const },
  { id: "bike-parking", labelKey: "amenityBikeParking" as const },
  { id: "cable-tv", labelKey: "amenityCableTv" as const },
  { id: "pool", labelKey: "amenityPool" as const },
  { id: "gym", labelKey: "amenityGym" as const },
  { id: "parking", labelKey: "amenityParking" as const },
  { id: "garden", labelKey: "amenityGarden" as const },
  { id: "security", labelKey: "amenitySecurity" as const },
  { id: "elevator", labelKey: "amenityElevator" as const },
  { id: "wifi", labelKey: "amenityWifi" as const },
  { id: "air-conditioning", labelKey: "amenityAirConditioning" as const },
];

const STATUS_OPTIONS = ["Available", "Occupied", "Draft"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

const statusBadgeVariant: Record<
  Status,
  "success" | "error" | "default"
> = {
  Available: "success",
  Occupied: "error",
  Draft: "default",
};

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
  imageUrls?: string[];
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
  agentInviteSentAt?: string;
  invitedAgentName?: string;
  lineGroup?: string;
  contractStartDate?: string;
  openForAgent?: boolean;
  publicListing?: boolean;
  leaseDurationMonths?: number;
  contractKey?: string;
  reservedAt?: string;
  reservedByName?: string;
  reservedByContact?: string;
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

const LISTING_PLATFORMS: { apiValue: string; labelKey: "platformFb" | "platformDDproperty" | "platformLivinginsider" | "platformDotProperty" }[] = [
  { apiValue: "Facebook Marketplace", labelKey: "platformFb" },
  { apiValue: "DDproperty", labelKey: "platformDDproperty" },
  { apiValue: "Livinginsider", labelKey: "platformLivinginsider" },
  { apiValue: "DotProperty", labelKey: "platformDotProperty" },
];

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contractInputRef = useRef<HTMLInputElement>(null);
  const modalContractInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const t = useTranslations("propertyDetail");
  const tEdit = useTranslations("propertyEdit");
  const tProps = useTranslations("properties");
  const tAuth = useTranslations("auth");
  const tInvite = useTranslations("invite");

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
  const [agentInviteSentAt, setAgentInviteSentAt] = useState<string | undefined>(undefined);
  const [invitedAgentName, setInvitedAgentName] = useState("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [lineGroup, setLineGroup] = useState("");
  const [openForAgent, setOpenForAgent] = useState(false);
  const [publicListing, setPublicListing] = useState(false);
  const [leaseDurationMonths, setLeaseDurationMonths] = useState("");
  const [contractKey, setContractKey] = useState<string | undefined>(undefined);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [setRentedModalOpen, setSetRentedModalOpen] = useState(false);
  const [setRentedLoading, setSetRentedLoading] = useState(false);
  const [modalTenantName, setModalTenantName] = useState("");
  const [modalTenantContact, setModalTenantContact] = useState("");
  const [modalAgentName, setModalAgentName] = useState("");
  const [modalContractStartDate, setModalContractStartDate] = useState("");
  const [modalLeaseDurationMonths, setModalLeaseDurationMonths] = useState("");
  const [modalContractFile, setModalContractFile] = useState<File | null>(null);
  const [setRentedError, setSetRentedError] = useState<string | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [reservedAt, setReservedAt] = useState<string | undefined>(undefined);
  const [reservedByName, setReservedByName] = useState("");
  const [reservedByContact, setReservedByContact] = useState("");
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveName, setReserveName] = useState("");
  const [reserveContact, setReserveContact] = useState("");
  const [rentalHistory, setRentalHistory] = useState<RentalHistoryItem[]>([]);
  const [rentalHistoryLoading, setRentalHistoryLoading] = useState(false);
  const [existingImageKeys, setExistingImageKeys] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [nameError, setNameError] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removeAgentModalOpen, setRemoveAgentModalOpen] = useState(false);
  const [removeAgentLoading, setRemoveAgentLoading] = useState(false);

  const setFormFromProperty = (p: PropertyData) => {
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
    setAgentInviteSentAt((p as { agentInviteSentAt?: string }).agentInviteSentAt ?? undefined);
    setInvitedAgentName((p as { invitedAgentName?: string }).invitedAgentName ?? "");
    // #region debug chat button
    fetch("http://127.0.0.1:7803/ingest/908fb44a-2012-43fd-b36e-e7f74cb458a6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d6e810" },
      body: JSON.stringify({
        sessionId: "d6e810",
        hypothesisId: "H1",
        location: "owner/properties/[id]/edit/page.tsx:setPropertyState",
        message: "Property state set; agentLineId from API",
        data: {
          hasAgentLineId: !!(p.agentLineId ?? "").trim(),
          agentLineIdLength: (p.agentLineId ?? "").length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    setContractStartDate(p.contractStartDate ?? "");
    setLineGroup(p.lineGroup ?? "");
    setOpenForAgent((p as { openForAgent?: boolean }).openForAgent ?? false);
    setPublicListing((p as { publicListing?: boolean }).publicListing ?? false);
    setLeaseDurationMonths((p as { leaseDurationMonths?: number }).leaseDurationMonths != null ? String((p as { leaseDurationMonths?: number }).leaseDurationMonths) : "");
    setContractKey((p as { contractKey?: string }).contractKey ?? undefined);
    setExistingImageKeys(Array.isArray(p.imageKeys) ? p.imageKeys : []);
    setExistingImageUrls(Array.isArray(p.imageUrls) ? p.imageUrls : []);
    setReservedAt(p.reservedAt ?? undefined);
    setReservedByName(p.reservedByName ?? "");
    setReservedByContact(p.reservedByContact ?? "");
  };

  useEffect(() => {
    if (!id) return;
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
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setLoadError(t("invalidProperty"));
      return;
    }
    let cancelled = false;
    async function fetchProperty() {
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (!token) {
          if (!cancelled) setLoadError(tAuth("pleaseLogin"));
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/owner/properties/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.status === 401) {
          setLoadError(tAuth("pleaseLogin"));
          setLoading(false);
          return;
        }
        if (res.status === 404) {
          setLoadError(t("notFound"));
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
          setLoadError(tEdit("invalidResponse"));
          setLoading(false);
          return;
        }
        setFormFromProperty(p);
        setLoadError(null);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : t("failedToLoad"));
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
    tEdit(opt.labelKey).toLowerCase().includes(amenitySearch.toLowerCase().trim())
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
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
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
            setUploadError(tEdit("uploadInvalidResponse"));
            setSaving(false);
            return;
          }
        } catch (uploadErr) {
          setUploadProgress(null);
          setUploadError(
            uploadErr instanceof Error ? uploadErr.message : tEdit("uploadFailed")
          );
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

      const imageKeys = [...existingImageKeys, ...newKeys];
      let finalContractKey: string | undefined = contractKey;
      if (contractFile) {
        setUploadProgress(0);
        try {
          const contractUpload = await uploadFilesWithProgress([contractFile], setUploadProgress);
          setUploadProgress(null);
          const keys = (contractUpload.uploads ?? []).map((u) => u.key);
          if (keys.length > 0) finalContractKey = keys[0];
        } catch (contractErr) {
          setUploadProgress(null);
          setUploadError(contractErr instanceof Error ? contractErr.message : tEdit("contractUploadFailed"));
          setSaving(false);
          return;
        }
      }
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
        contractStartDate: contractStartDate.trim() || undefined,
        lineGroup: lineGroup.trim() || undefined,
        openForAgent: openForAgent || undefined,
        publicListing: publicListing || undefined,
        leaseDurationMonths: leaseDurationMonths.trim() ? parseInt(leaseDurationMonths, 10) : undefined,
        contractKey: finalContractKey,
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
      setUploadError(err instanceof Error ? err.message : tEdit("saveFailedGeneric"));
    } finally {
      setSaving(false);
    }
  };

  const handleSetRentedSubmit = async () => {
    if (!modalTenantName.trim()) {
      setSetRentedError(tEdit("tenantNameRequiredError"));
      return;
    }
    if (!modalContractStartDate.trim()) {
      setSetRentedError(tEdit("leaseStartRequiredError"));
      return;
    }
    const startDate = new Date(modalContractStartDate);
    if (Number.isNaN(startDate.getTime())) {
      setSetRentedError(tEdit("invalidLeaseStartError"));
      return;
    }
    const duration = parseInt(modalLeaseDurationMonths, 10);
    if (!Number.isInteger(duration) || duration < 1) {
      setSetRentedError(tEdit("leaseDurationRequiredError"));
      return;
    }
    setSetRentedLoading(true);
    setSetRentedError(null);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        setSetRentedError(tAuth("pleaseLogin"));
        setSetRentedLoading(false);
        return;
      }
      let contractKey: string | undefined;
      if (modalContractFile) {
        const uploadRes = await uploadFilesWithProgress([modalContractFile], () => {});
        const keys = (uploadRes.uploads ?? []).map((u) => u.key);
        if (keys.length > 0) contractKey = keys[0];
      }
      const price = Number(monthlyRent.replace(/,/g, "")) || 0;
      const res = await fetch(`/api/owner/properties/${id}/set-rented`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantName: modalTenantName.trim(),
          tenantLineId: modalTenantContact.trim() || undefined,
          agentName: modalAgentName.trim() || undefined,
          contractStartDate: modalContractStartDate,
          leaseDurationMonths: duration,
          contractKey,
          rentPriceAtThatTime: price,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSetRentedError(data.message ?? tEdit("setRentedFailed"));
        setSetRentedLoading(false);
        return;
      }
      setStatus("Occupied");
      setTenantName(modalTenantName.trim());
      setTenantLineId(modalTenantContact.trim());
      setAgentName(modalAgentName.trim());
      setContractStartDate(modalContractStartDate);
      setLeaseDurationMonths(String(duration));
      if (contractKey) setContractKey(contractKey);
      setSetRentedModalOpen(false);
      setModalTenantName("");
      setModalTenantContact("");
      setModalAgentName("");
      setModalContractStartDate("");
      setModalLeaseDurationMonths("");
      setModalContractFile(null);
    } catch (err) {
      setSetRentedError(err instanceof Error ? err.message : tEdit("saveFailedGeneric"));
    } finally {
      setSetRentedLoading(false);
    }
  };

  const handleCheckoutConfirm = async () => {
    if (!id) return;
    setCheckoutLoading(true);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        toast.show(tAuth("pleaseLogin"));
        setCheckoutLoading(false);
        return;
      }
      const res = await fetch(`/api/owner/properties/${id}/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        toast.show(data.message ?? t("checkoutFailed"));
        setCheckoutLoading(false);
        return;
      }
      setCheckoutModalOpen(false);
      const refetchRes = await fetch(`/api/owner/properties/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refetchRes.ok) {
        const data = await refetchRes.json();
        const p: PropertyData = data.property;
        if (p) setFormFromProperty(p);
        toast.show(t("checkoutSuccess"));
      } else {
        toast.show(t("checkoutSuccess"));
      }
    } catch (err) {
      console.error("[EditProperty checkout]", err);
      toast.show(t("checkoutFailed"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleInviteAgent = async () => {
    if (!id) return;
    setInviteLoading(true);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        toast.show(tAuth("pleaseLogin"));
        setInviteLoading(false);
        return;
      }
      const res = await fetch(`/api/owner/properties/${id}/invite-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invitedAgentName: agentName.trim() || undefined,
        }),
      });
      if (!res.ok) {
        setInviteLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({})) as { inviteUrl?: string };
      const inviteUrl = data.inviteUrl;
      if (!inviteUrl || typeof inviteUrl !== "string") {
        setInviteLoading(false);
        return;
      }
      setAgentInviteSentAt(new Date().toISOString());
      setInvitedAgentName(agentName.trim() || "");
      const shareText = tInvite("shareMessage")
        .replace("{propertyName}", name.trim() || "—")
        .replace("{url}", inviteUrl);
      window.location.href = `https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`;
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveAgent = async () => {
    if (!id) return;
    setRemoveAgentLoading(true);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        setRemoveAgentLoading(false);
        return;
      }
      const res = await fetch(`/api/owner/properties/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agentLineId: "", agentName: "" }),
      });
      if (!res.ok) {
        setRemoveAgentLoading(false);
        return;
      }
      setRemoveAgentModalOpen(false);
      setAgentLineId("");
      setAgentName("");
    } finally {
      setRemoveAgentLoading(false);
    }
  };

  const handleReserve = async () => {
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
        const p: PropertyData = data.property;
        if (p) setFormFromProperty(p);
      }
    } finally {
      setReserveLoading(false);
    }
  };

  const handleClearReservation = async () => {
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
        const p: PropertyData = data.property;
        if (p) setFormFromProperty(p);
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500 text-sm">{t("loading")}</p>
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
            aria-label={tEdit("backAria")}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="flex-1 text-lg font-semibold text-[#0F172A] text-center -ml-12">
            {tEdit("editPageTitle")}
          </h1>
          <span className="w-10" aria-hidden />
        </div>
      </header>

      {setRentedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="set-rented-title">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-4 max-h-[90vh] overflow-y-auto space-y-4">
            <h2 id="set-rented-title" className="text-lg font-semibold text-[#0F172A]">{tEdit("setRentedTitle")}</h2>
            <p className="text-sm text-slate-600">{tEdit("setRentedDescription")}</p>
            <div>
              <label htmlFor="modal-tenant-name" className="block text-sm font-medium text-[#0F172A] mb-1">{tEdit("tenantNameRequired")}</label>
              <input
                id="modal-tenant-name"
                type="text"
                value={modalTenantName}
                onChange={(e) => setModalTenantName(e.target.value)}
                placeholder={tEdit("tenantNamePlaceholder")}
                className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                disabled={setRentedLoading}
              />
            </div>
            <div>
              <label htmlFor="modal-tenant-contact" className="block text-sm text-slate-500 mb-1">{tEdit("tenantContactLabel")}</label>
              <input
                id="modal-tenant-contact"
                type="text"
                value={modalTenantContact}
                onChange={(e) => setModalTenantContact(e.target.value)}
                placeholder={tEdit("tenantContactPlaceholder")}
                className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                disabled={setRentedLoading}
              />
            </div>
            <div>
              <label htmlFor="modal-agent-name" className="block text-sm text-slate-500 mb-1">{t("agentSection")}</label>
              <div className="flex gap-0 rounded-lg border border-slate-200 bg-white overflow-hidden">
                <input
                  id="modal-agent-name"
                  type="text"
                  value={modalAgentName}
                  onChange={(e) => setModalAgentName(e.target.value)}
                  placeholder={t("agentPlaceholder")}
                  className={`${inputBase} border-0 rounded-none flex-1 min-w-0 px-3`}
                  disabled={setRentedLoading}
                />
                <button
                  type="button"
                  onClick={handleInviteAgent}
                  disabled={inviteLoading || setRentedLoading}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 border-l border-slate-200 border-[#06C755] bg-transparent text-[#06C755] font-medium text-sm hover:bg-[#06C755]/5 tap-target min-h-[44px] disabled:opacity-50"
                  aria-label={tInvite("inviteAgentAria")}
                >
                  <UserPlus className="h-4 w-4" aria-hidden />
                  {tInvite("inviteAgent")}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="modal-contract-start" className="block text-sm font-medium text-[#0F172A] mb-1">{tEdit("leaseStartDate")}</label>
              <input
                id="modal-contract-start"
                type="date"
                value={modalContractStartDate}
                onChange={(e) => setModalContractStartDate(e.target.value)}
                className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                disabled={setRentedLoading}
              />
            </div>
            <div>
              <label htmlFor="modal-lease-duration" className="block text-sm font-medium text-[#0F172A] mb-1">{tEdit("leaseDurationMonths")}</label>
              <input
                id="modal-lease-duration"
                type="number"
                min={1}
                value={modalLeaseDurationMonths}
                onChange={(e) => setModalLeaseDurationMonths(e.target.value)}
                placeholder={tEdit("leaseDurationPlaceholder")}
                className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                disabled={setRentedLoading}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">{tEdit("contractFileOptional")}</label>
              <input
                ref={modalContractInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setModalContractFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => modalContractInputRef.current?.click()}
                className="text-sm text-[#10B981] hover:underline"
                disabled={setRentedLoading}
              >
                {modalContractFile ? modalContractFile.name : tEdit("chooseFilePdf")}
              </button>
            </div>
            {setRentedError && <p className="text-sm text-red-600" role="alert">{setRentedError}</p>}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { if (!setRentedLoading) setSetRentedModalOpen(false); setSetRentedError(null); }}
                className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 disabled:opacity-50"
                disabled={setRentedLoading}
              >
                {t("cloneCancel")}
              </button>
              <button
                type="button"
                onClick={handleSetRentedSubmit}
                className="px-4 py-2 rounded-lg bg-[#10B981] text-white font-medium hover:bg-[#10B981]/90 disabled:opacity-50"
                disabled={setRentedLoading}
              >
                {setRentedLoading ? tEdit("saving") : tEdit("save")}
              </button>
            </div>
          </div>
        </div>
      )}

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
            {existingImageKeys.length > 0 && (
              <ul className="mb-3 space-y-2">
                {existingImageKeys.map((_key, index) => {
                  const url = existingImageUrls[index];
                  return (
                  <li
                    key={`existing-${index}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white overflow-hidden"
                  >
                    {url ? (
                      <div className="relative w-20 h-20 shrink-0 bg-slate-200 overflow-hidden">
                        <img
                          src={url}
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
                  );
                })}
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
                    ? tEdit("addMorePhotos")
                    : tEdit("addMorePhotos")}
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
              {tEdit("homesSaleOrRent")}
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
                  {tEdit(opt.labelKey)}
                </option>
              ))}
            </select>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
              {tEdit("basicInfo")}
            </h2>
            <div>
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                {tEdit("propertyName")}
              </label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(false);
                }}
                placeholder={tEdit("propertyNamePlaceholder")}
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
                  {tEdit("propertyNameRequired")}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="edit-type"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                {tEdit("propertyType")}
              </label>
              <select
                id="edit-type"
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
              <label
                htmlFor="edit-rent"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                {tEdit("monthlyRent")}
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
                  {tEdit("monthlyRentRequired")}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="edit-address"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                {tEdit("address")}
              </label>
              <textarea
                id="edit-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={tEdit("addressPlaceholder")}
                rows={3}
                className={`${inputBase} resize-none border border-slate-200 rounded-lg px-3 focus:border-[#003366]`}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
              {tEdit("details")}
            </h2>
            <div>
              <label
                htmlFor="edit-bedrooms"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                {t("bedrooms")}
              </label>
              <input
                id="edit-bedrooms"
                type="text"
                inputMode="numeric"
                value={bedrooms}
                onChange={(e) =>
                  setBedrooms(e.target.value.replace(/\D/g, ""))
                }
                placeholder={tEdit("bedroomsPlaceholder")}
                className={`${inputBase} border border-slate-200 rounded-lg px-3`}
              />
            </div>
            <div>
              <label
                htmlFor="edit-bathrooms"
                className="block text-sm font-medium text-[#0F172A] mb-1"
              >
                {t("bathrooms")}
              </label>
              <input
                id="edit-bathrooms"
                type="text"
                inputMode="numeric"
                value={bathrooms}
                onChange={(e) =>
                  setBathrooms(e.target.value.replace(/\D/g, ""))
                }
                placeholder={tEdit("bathroomsPlaceholder")}
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
                {tEdit("keepAddressPrivate")}
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
              {tEdit("addressPrivateDescription")}
            </p>
          </section>

          <section>
            <label
              htmlFor="edit-description"
              className="block text-sm font-medium text-[#0F172A] mb-1"
            >
              {tEdit("propertyDescription")}
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tEdit("propertyDescriptionPlaceholder")}
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
              <p className="mt-1 text-xs text-slate-500">{tEdit("optional")}</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
              {t("amenities")}
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

          <section>
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide mb-3">
              {t("rentalStatus")}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={statusBadgeVariant[status]} className="text-xs">
                {tProps(`status.${status}`)}
              </Badge>
              {status === "Available" && reservedAt && (
                <Badge variant="warning" className="text-xs">
                  {t("reserved")}
                </Badge>
              )}
            </div>
            {status === "Available" && (
              <div className="space-y-2">
                {!reservedAt ? (
                  <button
                    type="button"
                    onClick={() => setReserveModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100 tap-target min-h-[44px]"
                  >
                    {t("reserve")}
                  </button>
                ) : (
                  <>
                    {(reservedByName || reservedByContact) && (
                      <div className="text-sm text-slate-600 space-y-0.5">
                        {reservedByName && (
                          <p>{t("reservedByName")}: {reservedByName}</p>
                        )}
                        {reservedByContact && (
                          <p>{t("reservedByContact")}: {reservedByContact}</p>
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
                  </>
                )}
              </div>
            )}
          </section>

          {reserveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="reserve-modal-title">
              <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-4 space-y-4">
                <h2 id="reserve-modal-title" className="text-lg font-semibold text-[#0F172A]">{t("reserve")}</h2>
                <p className="text-sm text-slate-600">{t("reservedByName")} / {t("reservedByContact")} (optional)</p>
                <div>
                  <label htmlFor="edit-reserve-name" className="block text-sm text-slate-500 mb-1">{t("reservedByName")}</label>
                  <input
                    id="edit-reserve-name"
                    type="text"
                    value={reserveName}
                    onChange={(e) => setReserveName(e.target.value)}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                    disabled={reserveLoading}
                  />
                </div>
                <div>
                  <label htmlFor="edit-reserve-contact" className="block text-sm text-slate-500 mb-1">{t("reservedByContact")}</label>
                  <input
                    id="edit-reserve-contact"
                    type="text"
                    value={reserveContact}
                    onChange={(e) => setReserveContact(e.target.value)}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3`}
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

          {checkoutModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
              <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-4 space-y-4">
                <h2 id="checkout-title" className="text-lg font-semibold text-[#0F172A]">{t("checkoutConfirmTitle")}</h2>
                <p className="text-sm text-slate-600">{t("checkoutConfirmMessage")}</p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { if (!checkoutLoading) setCheckoutModalOpen(false); }}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#0F172A] hover:bg-slate-50 tap-target min-h-[44px]"
                    disabled={checkoutLoading}
                  >
                    {t("cloneCancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckoutConfirm}
                    className="px-4 py-2.5 rounded-lg bg-[#003366] text-white text-sm font-medium hover:bg-[#002244] tap-target min-h-[44px] disabled:opacity-60"
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? t("loading") : t("checkout")}
                  </button>
                </div>
              </div>
            </div>
          )}
          {removeAgentModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="remove-agent-title">
              <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-4 space-y-4">
                <h2 id="remove-agent-title" className="text-lg font-semibold text-[#0F172A]">{t("removeAgent")}</h2>
                <p className="text-sm text-slate-600">{t("removeAgentConfirm")}</p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { if (!removeAgentLoading) setRemoveAgentModalOpen(false); }}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#0F172A] hover:bg-slate-50 tap-target min-h-[44px]"
                    disabled={removeAgentLoading}
                  >
                    {t("cloneCancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAgent}
                    className="px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 tap-target min-h-[44px] disabled:opacity-60"
                    disabled={removeAgentLoading}
                  >
                    {removeAgentLoading ? t("loading") : t("removeAgent")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === "Available" && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
                {tEdit("listingOptions")}
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={openForAgent}
                  onChange={(e) => setOpenForAgent(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-[#0F172A]">{tEdit("openForAgent")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicListing}
                  onChange={(e) => setPublicListing(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-[#0F172A]">{tEdit("publicListing")}</span>
              </label>
              {publicListing && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = [
                        name.trim(),
                        propertyType,
                        `฿${(Number(monthlyRent.replace(/,/g, "")) || 0).toLocaleString()}/mo`,
                        address.trim(),
                        description.trim(),
                      ].filter(Boolean).join("\n");
                      navigator.clipboard.writeText(text).then(() => toast.show(tEdit("copiedToClipboard")));
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#0F172A] hover:bg-slate-50"
                  >
                    <Copy className="h-4 w-4" />
                    {tEdit("copyTextFb")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      existingImageUrls.forEach((url, i) => {
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `property-${i + 1}.jpg`;
                        a.target = "_blank";
                        a.rel = "noopener";
                        a.click();
                      });
                      if (existingImageUrls.length === 0) toast.show(tEdit("noPhotosToDownload"));
                      else toast.show(tEdit("downloadingPhotos"));
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#0F172A] hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    {tEdit("downloadPhotosDDproperty")}
                  </button>
                </div>
              )}
            </section>
          )}

          {status === "Occupied" && (
            <section className="space-y-6">
              <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide flex items-center gap-2 flex-wrap">
                {tEdit("residentDetails")}
                {contractStartDate.trim() && !Number.isNaN(parseInt(leaseDurationMonths, 10)) && isContractEnded(contractStartDate, parseInt(leaseDurationMonths, 10)) && (
                  <Badge variant="default">{t("contractEnded")}</Badge>
                )}
              </h2>

              {/* Tenant section */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-4">
                <h3 className="text-sm font-medium text-[#0F172A]">{t("tenantSection")}</h3>
                <div>
                  <label htmlFor="edit-tenant" className="block text-sm font-medium text-[#0F172A] mb-1">
                    {tEdit("tenantName")}
                  </label>
                  <input
                    id="edit-tenant"
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder={tEdit("tenantNamePlaceholder2")}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                  />
                </div>
                <div>
                  <label htmlFor="edit-tenant-line-id" className="block text-sm text-slate-500 mb-1">
                    {tEdit("lineIdOptional")}
                  </label>
                  <input
                    id="edit-tenant-line-id"
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
                {agentLineId?.trim() ? (
                  /* Connected Agent Card */
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                        {(agentName || "A").trim().slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#0F172A] truncate">{agentName?.trim() || t("agent")}</p>
                        <p className="flex items-center gap-1 text-xs text-emerald-600">
                          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {t("connected")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`https://line.me/ti/p/~${agentLineId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#06C755] bg-transparent text-[#06C755] font-medium text-sm hover:bg-[#06C755]/10 tap-target min-h-[44px]"
                        onClick={() => {
                          // #region debug chat button
                          fetch("http://127.0.0.1:7803/ingest/908fb44a-2012-43fd-b36e-e7f74cb458a6", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d6e810" },
                            body: JSON.stringify({
                              sessionId: "d6e810",
                              hypothesisId: "H2",
                              location: "owner/properties/[id]/edit/page.tsx:chat-link-click",
                              message: "Chat link clicked",
                              data: {
                                agentLineIdLength: (agentLineId ?? "").length,
                                hrefPrefix: "https://line.me/ti/p/~",
                              },
                              timestamp: Date.now(),
                            }),
                          }).catch(() => {});
                          // #endregion
                        }}
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden />
                        {t("chat")}
                      </a>
                      <button
                        type="button"
                        onClick={() => setRemoveAgentModalOpen(true)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        {t("removeAgent")}
                      </button>
                    </div>
                  </div>
                ) : agentInviteSentAt ? (
                  /* Invited (waiting for agent to accept) */
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
                    <p className="flex items-center gap-2 text-sm font-medium text-amber-700">
                      <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                      {t("invitedStatus")}
                    </p>
                    {invitedAgentName && (
                      <p className="text-sm text-slate-600">
                        {t("invitedToName", { name: invitedAgentName })}
                      </p>
                    )}
                    <div className="flex gap-0 rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <input
                        id="edit-agent"
                        type="text"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder={t("agentPlaceholder")}
                        className={`${inputBase} border-0 rounded-none flex-1 min-w-0 px-3`}
                      />
                      <button
                        type="button"
                        onClick={handleInviteAgent}
                        disabled={inviteLoading}
                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 border-l border-slate-200 border-[#06C755] bg-transparent text-[#06C755] font-medium text-sm hover:bg-[#06C755]/5 tap-target min-h-[44px] disabled:opacity-50"
                        aria-label={tInvite("inviteAgentAria")}
                      >
                        <UserPlus className="h-4 w-4" aria-hidden />
                        {tInvite("inviteAgent")}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Input group: agent name + Invite */
                  <div className="flex gap-0 rounded-lg border border-slate-200 bg-white overflow-hidden">
                    <input
                      id="edit-agent"
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder={t("agentPlaceholder")}
                      className={`${inputBase} border-0 rounded-none flex-1 min-w-0 px-3`}
                    />
                    <button
                      type="button"
                      onClick={handleInviteAgent}
                      disabled={inviteLoading}
                      className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 border-l border-slate-200 border-[#06C755] bg-transparent text-[#06C755] font-medium text-sm hover:bg-[#06C755]/5 tap-target min-h-[44px] disabled:opacity-50"
                      aria-label={tInvite("inviteAgentAria")}
                    >
                      <UserPlus className="h-4 w-4" aria-hidden />
                      {tInvite("inviteAgent")}
                    </button>
                  </div>
                )}

                <div>
                  <label htmlFor="edit-line-group" className="block text-sm text-slate-500 mb-1">
                    {tEdit("lineGroupOptional")}
                  </label>
                  <input
                    id="edit-line-group"
                    type="text"
                    value={lineGroup}
                    onChange={(e) => setLineGroup(e.target.value)}
                    placeholder={tEdit("lineGroupPlaceholder")}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                  />
                </div>
              </div>

              {/* Contract / lease fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-contract-start-date" className="block text-sm font-medium text-[#0F172A] mb-1">
                    {tEdit("contractStartOptional")}
                  </label>
                  <input
                    id="edit-contract-start-date"
                    type="date"
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                  />
                </div>
                <div>
                  <label htmlFor="edit-lease-duration" className="block text-sm font-medium text-[#0F172A] mb-1">
                    Lease Duration (months)
                  </label>
                  <input
                    id="edit-lease-duration"
                    type="number"
                    min={1}
                    value={leaseDurationMonths}
                    onChange={(e) => setLeaseDurationMonths(e.target.value)}
                    placeholder={tEdit("leaseDurationPlaceholder")}
                    className={`${inputBase} border border-slate-200 rounded-lg px-3`}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">{tEdit("contractFileOptional")}</label>
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
                    {contractFile ? contractFile.name : contractKey ? tEdit("replaceContractFile") : tEdit("chooseFilePdf")}
                  </button>
                </div>
              </div>
            </section>
          )}

          <hr className="border-t-2 border-slate-200 my-6" aria-hidden />
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
              {t("rentalHistory")}
            </h2>
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

          {status === "Available" && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide">
                {tEdit("publishToListingSites")}
              </h2>
              <p className="text-sm text-slate-600">{tEdit("publicListingPage")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== "undefined" ? `${window.location.origin}/listings/${id}` : "";
                    navigator.clipboard.writeText(url).then(() => toast.show(tEdit("copiedToClipboard")));
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#0F172A] hover:bg-slate-50"
                >
                  <Copy className="h-4 w-4" />
                  {tEdit("copyLink")}
                </button>
                <a
                  href={`/listings/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#0F172A] hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  {tEdit("preview")}
                </a>
              </div>
              <p className="text-xs text-slate-500">{tEdit("enablePublicListingHint")}</p>
              <div className="pt-2">
                <p className="text-sm font-medium text-[#0F172A] mb-2">{tEdit("listingPlatformsComingSoon")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {LISTING_PLATFORMS.map((platform) => (
                    <button
                      key={platform.apiValue}
                      type="button"
                      onClick={() => {
                        toast.show(`ฟีเจอร์นี้กำลังพัฒนา! คุณอยากให้เราเชื่อมต่อกับ ${tEdit(platform.labelKey)} ก่อนใครหรือไม่?`);
                        fetch("/api/log/listing-interest", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ platform: platform.apiValue }),
                        }).catch(() => {});
                      }}
                      className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 relative grayscale opacity-90"
                    >
                      <span className="text-xs font-medium text-center">{tEdit(platform.labelKey)}</span>
                      <span className="text-[10px] text-amber-600 font-medium">{tEdit("comingSoon")}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-30 max-w-lg mx-auto safe-area-bottom bg-white border-t border-slate-100 p-4 space-y-3">
        {status === "Occupied" && (
          <button
            type="button"
            onClick={() => setCheckoutModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-base font-medium hover:bg-red-100 tap-target min-h-[48px]"
          >
            {t("notifyMoveOut")}
          </button>
        )}
        {status === "Available" && (
          <button
            type="button"
            onClick={() => {
              setSetRentedModalOpen(true);
              setSetRentedError(null);
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-green-200 bg-green-50 text-green-800 text-base font-medium hover:bg-green-100 tap-target min-h-[48px]"
          >
            {t("gotTenant")}
          </button>
        )}
        {status === "Draft" && (
          <button
            type="button"
            onClick={() => setStatus("Available")}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-base font-medium hover:bg-red-100 tap-target min-h-[48px]"
          >
            {t("publish")}
          </button>
        )}
        <Button
          type="submit"
          form="edit-property-form"
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
