import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IParkingSession {
  _id: Types.ObjectId;
  ticketNumber: string;
  plateNumber: string;
  checkinOperator: Types.ObjectId;
  checkinAt: Date;
  place?: Types.ObjectId | null;
  checkoutOperator?: Types.ObjectId;
  checkoutAt?: Date;
  durationMinutes?: number;
  feeCents?: number;
  paymentMethod?: "CASH" | "CARD";
  paymentCollected: boolean;
  paymentCollectedAt?: Date;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  pricingTier?: "STANDARD" | "BRONZE" | "SILVER" | "GOLD";
}

const ParkingSessionSchema = new Schema<IParkingSession>({
  ticketNumber: { type: String, required: true, unique: true },
  plateNumber: { type: String, required: true },
  checkinOperator: { type: Schema.Types.ObjectId, ref: "User", required: true },
  checkinAt: { type: Date, required: true },
  place: { type: Schema.Types.ObjectId, ref: "Place", default: null },
  checkoutOperator: { type: Schema.Types.ObjectId, ref: "User" },
  checkoutAt: { type: Date },
  durationMinutes: { type: Number },
  feeCents: { type: Number },
  paymentMethod: { type: String, enum: ["CASH", "CARD"] },
  paymentCollected: { type: Boolean, default: false },
  paymentCollectedAt: { type: Date },
  pricingTier: {
    type: String,
    enum: ["STANDARD", "BRONZE", "SILVER", "GOLD"],
    default: "STANDARD"
  },
  status: {
    type: String,
    enum: ["OPEN", "CLOSED", "CANCELLED"],
    default: "OPEN",
    required: true
  }
});

ParkingSessionSchema.index({ ticketNumber: 1 }, { unique: true });
ParkingSessionSchema.index({ status: 1, plateNumber: 1 });

export const ParkingSession: Model<IParkingSession> =
  mongoose.models.ParkingSession ||
  mongoose.model<IParkingSession>("ParkingSession", ParkingSessionSchema);
