"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  Users,
  Headphones,
  BedDouble,
  Bath,
  Square,
  MessageCircle,
} from "lucide-react";

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: "easeOut" },
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&q=80";
const FEATURED = [
  {
    id: "1",
    title: "Luxury Riverside Condo",
    location: "Bangkok, Sukhumvit",
    price: "฿45,000",
    beds: 2,
    baths: 2,
    sqm: 85,
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
  },
  {
    id: "2",
    title: "Modern High-Rise Suite",
    location: "Bangkok, Sathorn",
    price: "฿62,000",
    beds: 3,
    baths: 2,
    sqm: 120,
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
  },
  {
    id: "3",
    title: "Sky View Penthouse",
    location: "Bangkok, Phrom Phong",
    price: "฿95,000",
    beds: 3,
    baths: 3,
    sqm: 180,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
  },
  {
    id: "4",
    title: "Central Park Residence",
    location: "Bangkok, Thonglor",
    price: "฿38,000",
    beds: 1,
    baths: 1,
    sqm: 45,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
  },
];

export function AssetHubLandingPage() {
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            AssetHub
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/enter"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Login / Sign Up
            </Link>
            <Link
              href="#"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              List Property
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative min-h-[80vh] flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="absolute inset-0">
            <Image
              src={HERO_IMAGE}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-slate-900/40" aria-hidden />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow sm:text-5xl lg:text-6xl">
                Find Your Perfect Living Space
              </h1>
            </motion.div>
            <motion.div
              className="mt-8 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur sm:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            >
              <p className="mb-4 text-sm font-medium text-slate-600">
                Quick Search
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="flex-1">
                  <label htmlFor="location" className="sr-only">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="property-type" className="sr-only">
                    Property Type
                  </label>
                  <select
                    id="property-type"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                  >
                    <option value="">Property Type</option>
                    <option value="condo">Condo</option>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="price-range" className="sr-only">
                    Price Range
                  </label>
                  <select
                    id="price-range"
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                  >
                    <option value="">Price Range</option>
                    <option value="0-30">Under ฿30,000</option>
                    <option value="30-50">฿30,000 - ฿50,000</option>
                    <option value="50-80">฿50,000 - ฿80,000</option>
                    <option value="80+">฿80,000+</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  <Search className="h-5 w-5" aria-hidden />
                  Search
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <motion.section
          className="border-y border-slate-200 bg-slate-50 py-6"
          {...reveal}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 sm:px-6 lg:gap-12 lg:px-8">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-slate-700" aria-hidden />
              <span className="text-lg font-semibold text-slate-900">
                10k+ Properties
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-slate-700" aria-hidden />
              <span className="text-lg font-semibold text-slate-900">
                5k+ Happy Customers
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Headphones className="h-8 w-8 text-slate-700" aria-hidden />
              <span className="text-lg font-semibold text-slate-900">
                24/7 Support
              </span>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
          {...reveal}
        >
          <h2 className="mb-10 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Featured Condos
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <span className="absolute right-3 top-3 rounded-lg bg-slate-900/90 px-3 py-1.5 text-sm font-semibold text-white">
                    {item.price}
                    <span className="font-normal text-white/90">/mo</span>
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-600">{item.location}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="h-4 w-4" aria-hidden />
                      {item.beds} Beds
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bath className="h-4 w-4" aria-hidden />
                      {item.baths} Baths
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Square className="h-4 w-4" aria-hidden />
                      {item.sqm} SQM
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="border-t border-slate-200 bg-slate-50 py-14"
          {...reveal}
        >
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center sm:px-6 lg:flex-row lg:gap-6 lg:px-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#06C755] text-white">
              <MessageCircle className="h-8 w-8" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-900 sm:text-xl">
                Manage your property via Porjai - Our Smart LINE Assistant.
              </p>
              <p className="mt-1 text-slate-600">Coming Soon.</p>
            </div>
          </div>
        </motion.section>

        <motion.footer
          className="border-t border-slate-200 bg-slate-900 py-10"
          {...reveal}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <Link href="#" className="text-slate-300 hover:text-white">
                  About
                </Link>
                <Link href="#" className="text-slate-300 hover:text-white">
                  Contact
                </Link>
                <Link href="#" className="text-slate-300 hover:text-white">
                  Privacy
                </Link>
                <Link href="#" className="text-slate-300 hover:text-white">
                  Terms
                </Link>
                <Link href="/enter" className="text-slate-300 hover:text-white">
                  App
                </Link>
              </div>
              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} AssetHub. All rights reserved.
              </p>
            </div>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
