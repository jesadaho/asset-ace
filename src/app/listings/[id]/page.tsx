"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ImageIcon } from "lucide-react";

type ListingData = {
  id: string;
  name: string;
  type: string;
  price: number;
  address: string;
  description?: string;
  bedrooms?: string;
  bathrooms?: string;
  squareMeters?: string;
  amenities?: string[];
  imageUrls?: string[];
};

export default function PublicListingPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          setListing(null);
          return;
        }
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setListing(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchListing();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-600 text-sm">This listing is not available.</p>
      </div>
    );
  }

  const urls = listing.imageUrls?.length ? listing.imageUrls : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 py-4 px-4">
        <h1 className="text-lg font-semibold text-[#0F172A] text-center max-w-lg mx-auto">
          Asset Ace
        </h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="aspect-[4/3] bg-slate-200">
            {urls.length > 0 ? (
              <img
                src={urls[0]}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <ImageIcon className="h-12 w-12" aria-hidden />
              </div>
            )}
          </div>
          <div className="p-4 space-y-3">
            <h2 className="text-xl font-bold text-[#0F172A]">{listing.name}</h2>
            <p className="text-slate-600 text-sm">{listing.type}</p>
            <p className="font-semibold text-[#0F172A]">
              ฿{listing.price.toLocaleString()} / mo
            </p>
            <p className="text-slate-600 text-sm">{listing.address}</p>
          </div>
        </div>
        {listing.description && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mt-4">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-2">Details</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{listing.description}</p>
            {(listing.bedrooms || listing.bathrooms || listing.squareMeters) && (
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600">
                {listing.bedrooms && <span>Bedrooms: {listing.bedrooms}</span>}
                {listing.bathrooms && <span>Bathrooms: {listing.bathrooms}</span>}
                {listing.squareMeters && <span>{listing.squareMeters} m²</span>}
              </div>
            )}
          </section>
        )}
        {listing.amenities && listing.amenities.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mt-4">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-2">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {a}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
