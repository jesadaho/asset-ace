import mongoose from "mongoose";

export interface IBindCode {
  code: string; // e.g. "482193"
  propertyId: mongoose.Types.ObjectId;
  createdByLineUserId: string;
  expiresAt: Date;
  usedAt?: Date;
  usedByLineUserId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BindCodeSchema = new mongoose.Schema<IBindCode>(
  {
    code: { type: String, required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    createdByLineUserId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
    usedByLineUserId: { type: String },
  },
  { timestamps: true }
);

// One-time, short-lived tokens
BindCodeSchema.index({ code: 1 }, { unique: true });
BindCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const BindCode =
  mongoose.models.BindCode ??
  mongoose.model<IBindCode>("BindCode", BindCodeSchema);

