import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IPricingConfig {
  _id: Types.ObjectId;
  mode: "FIXED" | "HOURLY";
  fixedFeeCents?: number;
  hourlyFeeCents?: number;
  bronzeFixedFeeCents?: number;
  bronzeHourlyFeeCents?: number;
  silverFixedFeeCents?: number;
  silverHourlyFeeCents?: number;
  goldFixedFeeCents?: number;
  goldHourlyFeeCents?: number;
  graceMinutes: number;
  roundingMinutes: number;
  active: boolean;
  createdAt: Date;
}

const PricingConfigSchema = new Schema<IPricingConfig>({
  mode: { type: String, enum: ["FIXED", "HOURLY"], required: true },
  fixedFeeCents: { type: Number },
  hourlyFeeCents: { type: Number },
  bronzeFixedFeeCents: { type: Number },
  bronzeHourlyFeeCents: { type: Number },
  silverFixedFeeCents: { type: Number },
  silverHourlyFeeCents: { type: Number },
  goldFixedFeeCents: { type: Number },
  goldHourlyFeeCents: { type: Number },
  graceMinutes: { type: Number, default: 0 },
  roundingMinutes: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

PricingConfigSchema.index({ active: 1 });

export const PricingConfig: Model<IPricingConfig> =
  mongoose.models.PricingConfig ||
  mongoose.model<IPricingConfig>("PricingConfig", PricingConfigSchema);
