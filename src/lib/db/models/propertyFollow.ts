import mongoose from "mongoose";

export interface IPropertyFollow {
  propertyId: mongoose.Types.ObjectId;
  agentId: string;
  createdAt?: Date;
}

const PropertyFollowSchema = new mongoose.Schema<IPropertyFollow>(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Property" },
    agentId: { type: String, required: true },
  },
  { timestamps: true }
);

PropertyFollowSchema.index({ propertyId: 1, agentId: 1 }, { unique: true });
PropertyFollowSchema.index({ agentId: 1 });

export const PropertyFollow =
  mongoose.models.PropertyFollow ??
  mongoose.model<IPropertyFollow>("PropertyFollow", PropertyFollowSchema);
