import mongoose from "mongoose";

const ROLES = ["owner", "agent", "tenant"] as const;

export type UserRole = (typeof ROLES)[number];

export interface IUser {
  lineUserId: string;
  name: string;
  phone: string;
  role: UserRole;
  /** Optional LINE ID (@username) for opening 1:1 chat. Used in line.me/ti/p/~{lineId} */
  lineId?: string;
  paymentInfo?: string;
  notificationsEnabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    lineUserId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true, enum: ROLES },
    lineId: { type: String, required: false },
    paymentInfo: { type: String, required: false },
    notificationsEnabled: { type: Boolean, required: false },
  },
  { timestamps: true }
);

UserSchema.index({ lineUserId: 1 });

export const User =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
