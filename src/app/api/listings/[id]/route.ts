import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import {
  getInferredMonthlyRent,
  getInferredSalePrice,
  getPrimaryDisplayPrice,
} from "@/lib/property-pricing";
import { getPresignedGetUrl } from "@/lib/s3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  try {
    await connectDB();
    const doc = await Property.findOne({ _id: id }).lean();
    const publicListing = (doc as { publicListing?: boolean }).publicListing;
    const status = (doc as { status?: string }).status;
    if (!doc || !publicListing || status !== "Available") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const keys = (doc as { imageKeys?: string[] }).imageKeys ?? [];
    const imageUrls: string[] = [];
    for (const key of keys) {
      const url = await getPresignedGetUrl(key);
      if (url) imageUrls.push(url);
    }

    return NextResponse.json({
      id: (doc as { _id: mongoose.Types.ObjectId })._id.toString(),
      name: (doc as { name: string }).name,
      type: (doc as { type: string }).type,
      price: getPrimaryDisplayPrice(doc as {
        listingType?: string;
        saleWithTenant?: boolean;
        price?: number;
        salePrice?: number;
        monthlyRent?: number;
      }),
      salePrice: getInferredSalePrice(doc as {
        listingType?: string;
        saleWithTenant?: boolean;
        price?: number;
        salePrice?: number;
        monthlyRent?: number;
      }),
      monthlyRent: getInferredMonthlyRent(doc as {
        listingType?: string;
        saleWithTenant?: boolean;
        price?: number;
        salePrice?: number;
        monthlyRent?: number;
      }),
      address: (doc as { address: string }).address,
      description: (doc as { description?: string }).description,
      bedrooms: (doc as { bedrooms?: string }).bedrooms,
      bathrooms: (doc as { bathrooms?: string }).bathrooms,
      squareMeters: (doc as { squareMeters?: string }).squareMeters,
      amenities: (doc as { amenities?: string[] }).amenities ?? [],
      listingType: (doc as { listingType?: string }).listingType,
      saleWithTenant: (doc as { saleWithTenant?: boolean }).saleWithTenant ?? false,
      imageUrls,
    });
  } catch (err) {
    console.error("[GET /api/listings/[id]]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load listing" },
      { status: 500 }
    );
  }
}
