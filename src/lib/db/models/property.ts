import mongoose from "mongoose";

const PROPERTY_TYPES = ["Condo", "House", "Apartment"] as const;
const STATUSES = ["Available", "Occupied", "Maintenance", "Draft"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type PropertyStatus = (typeof STATUSES)[number];

export interface IProperty {
  ownerId: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  address: string;
  imageKeys: string[];
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
  contractStartDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const PropertySchema = new mongoose.Schema<IProperty>(
  {
    ownerId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: PROPERTY_TYPES },
    status: { type: String, required: true, enum: STATUSES },
    price: { type: Number, required: true },
    address: { type: String, required: true },
    imageKeys: { type: [String], default: [] },
    listingType: String,
    bedrooms: String,
    bathrooms: String,
    addressPrivate: Boolean,
    description: String,
    squareMeters: String,
    amenities: [String],
    tenantName: String,
    tenantLineId: String,
    agentName: String,
    agentLineId: String,
    lineGroup: String,
    contractStartDate: Date,
  },
  { timestamps: true }
);

PropertySchema.index({ ownerId: 1 });

export const Property =
  mongoose.models.Property ?? mongoose.model<IProperty>("Property", PropertySchema);
