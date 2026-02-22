import mongoose from "mongoose";

export interface IRentalHistory {
  propertyId: string;
  tenantName: string;
  agentName?: string;
  startDate: Date;
  endDate?: Date | null;
  durationMonths: number;
  contractKey?: string;
  rentPriceAtThatTime: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const RentalHistorySchema = new mongoose.Schema<IRentalHistory>(
  {
    propertyId: { type: String, required: true },
    tenantName: { type: String, required: true },
    agentName: String,
    startDate: { type: Date, required: true },
    endDate: Date,
    durationMonths: { type: Number, required: true },
    contractKey: String,
    rentPriceAtThatTime: { type: Number, required: true },
  },
  { timestamps: true }
);

RentalHistorySchema.index({ propertyId: 1, endDate: 1 });

export const RentalHistory =
  mongoose.models.RentalHistory ??
  mongoose.model<IRentalHistory>("RentalHistory", RentalHistorySchema);
