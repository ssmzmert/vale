import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "VALET" | "VIEWER";
  active: boolean;
  place?: Types.ObjectId | null;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["ADMIN", "VALET", "VIEWER"], required: true },
  active: { type: Boolean, default: true },
  place: { type: Schema.Types.ObjectId, ref: "Place", default: null },
  createdAt: { type: Date, default: Date.now }
});

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
