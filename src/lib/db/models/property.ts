import mongoose from "mongoose";

const PROPERTY_TYPES = ["Condo", "House", "Apartment"] as const;
const STATUSES = ["Available", "Occupied", "Draft", "Paused", "Archived"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type PropertyStatus = (typeof STATUSES)[number];

export interface IProperty {
  ownerId: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  salePrice?: number;
  monthlyRent?: number;
  address: string;
  imageKeys: string[];
  listingType?: string;
  saleWithTenant?: boolean;
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
  /** Agent's LINE account ID (@username) for chat link; set when agent accepts or from User.lineId */
  agentLineAccountId?: string;
  agentInviteSentAt?: Date;
  invitedAgentName?: string;
  lineGroup?: string;
  /** LINE Messaging API group id (e.g. C...) for bot in group chat; not the invite link hash */
  lineGroupId?: string;
  /** Day of month (1–31) rent is due; used with rent reminder cron */
  rentDueDayOfMonth?: number;
  /** Last time rent payment was recorded (e.g. slip verified or manual) */
  lastRentPaidAt?: Date;
  /** YYYY-MM of the due month we already sent overdue alert for (dedupe) */
  rentOverdueNotifiedForMonth?: string;
  contractStartDate?: Date;
  openForAgent?: boolean;
  publicListing?: boolean;
  leaseDurationMonths?: number;
  contractKey?: string;
  reservedAt?: Date;
  reservedByName?: string;
  reservedByContact?: string;
  /** Set when 30-day vacancy notification was sent for this lease; cleared on set-rented */
  vacancyNotified30DayAt?: Date;
  /** When true or unset, listing is shown on Asset Hub (e.g. after move-out). Default true. */
  showOnAssetHub?: boolean;
  /**
   * Rent payout display on bill / future owner settings: bank logo key (e.g. kbank, scb)
   * matching `public/bank-logos/{SYMBOL}.png` (see bank-logo BANK_LOGO_FILE_KEYS).
   */
  rentReceiveBankKey?: string;
  rentReceiveAccountNumber?: string;
  rentReceiveAccountName?: string;
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
    salePrice: Number,
    monthlyRent: Number,
    address: { type: String, default: "" },
    imageKeys: { type: [String], default: [] },
    listingType: String,
    saleWithTenant: Boolean,
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
    agentLineAccountId: String,
    agentInviteSentAt: Date,
    invitedAgentName: String,
    lineGroup: String,
    lineGroupId: String,
    rentDueDayOfMonth: Number,
    lastRentPaidAt: Date,
    rentOverdueNotifiedForMonth: String,
    contractStartDate: Date,
    openForAgent: Boolean,
    publicListing: Boolean,
    leaseDurationMonths: Number,
    contractKey: String,
    reservedAt: Date,
    reservedByName: String,
    reservedByContact: String,
    vacancyNotified30DayAt: Date,
    showOnAssetHub: { type: Boolean, default: true },
    rentReceiveBankKey: String,
    rentReceiveAccountNumber: String,
    rentReceiveAccountName: String,
  },
  { timestamps: true }
);

PropertySchema.index({ ownerId: 1 });
PropertySchema.index({ lineGroupId: 1 }, { unique: true, sparse: true });

export const Property =
  mongoose.models.Property ?? mongoose.model<IProperty>("Property", PropertySchema);
