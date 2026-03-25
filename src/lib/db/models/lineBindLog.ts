import mongoose from "mongoose";

export type BindSource = "liff_ui" | "webhook_command" | "api";

export interface ILineBindLog {
  propertyId?: mongoose.Types.ObjectId;
  groupId?: string;
  actorLineUserId?: string;
  source: BindSource;
  success: boolean;
  message?: string;
  meta?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const LineBindLogSchema = new mongoose.Schema<ILineBindLog>(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    groupId: { type: String, index: true },
    actorLineUserId: { type: String, index: true },
    source: { type: String, required: true },
    success: { type: Boolean, required: true },
    message: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

LineBindLogSchema.index({ createdAt: -1 });

export const LineBindLog =
  mongoose.models.LineBindLog ??
  mongoose.model<ILineBindLog>("LineBindLog", LineBindLogSchema);

