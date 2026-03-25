import mongoose from "mongoose";

export type RentTransactionStatus =
  | "accepted"
  | "rejected"
  | "duplicate"
  | "mismatch"
  | "unbound"
  | "error";

export interface IRentTransaction {
  propertyId: mongoose.Types.ObjectId;
  lineGroupId?: string;
  lineMessageId?: string;
  slipDate: Date;
  amount: number;
  fromName?: string;
  toName?: string;
  /** YYYY-MM key for the rent period this payment is applied to */
  periodKey: string;
  status: RentTransactionStatus;
  reason?: string;
  raw?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const RentTransactionSchema = new mongoose.Schema<IRentTransaction>(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    lineGroupId: { type: String, index: true },
    lineMessageId: { type: String },
    slipDate: { type: Date, required: true, index: true },
    amount: { type: Number, required: true },
    fromName: String,
    toName: String,
    periodKey: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    reason: String,
    raw: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Dedupe: same LINE image message should not be recorded twice.
RentTransactionSchema.index(
  { lineMessageId: 1 },
  { unique: true, sparse: true }
);

// Quick check: has the property paid for this period?
RentTransactionSchema.index({ propertyId: 1, periodKey: 1, status: 1 });

export const RentTransaction =
  mongoose.models.RentTransaction ??
  mongoose.model<IRentTransaction>("RentTransaction", RentTransactionSchema);

