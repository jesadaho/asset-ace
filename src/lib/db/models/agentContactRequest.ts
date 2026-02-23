import mongoose from "mongoose";

export interface IAgentContactRequest {
  propertyId: mongoose.Types.ObjectId;
  agentLineUserId: string;
  agentName: string;
  agentPhone: string;
  ownerId: string;
  requestedAt: Date;
}

const AgentContactRequestSchema = new mongoose.Schema<IAgentContactRequest>(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Property" },
    agentLineUserId: { type: String, required: true },
    agentName: { type: String, required: true },
    agentPhone: { type: String, required: true },
    ownerId: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AgentContactRequestSchema.index({ propertyId: 1, agentLineUserId: 1 }, { unique: true });
AgentContactRequestSchema.index({ ownerId: 1 });

export const AgentContactRequest =
  mongoose.models.AgentContactRequest ??
  mongoose.model<IAgentContactRequest>("AgentContactRequest", AgentContactRequestSchema);
