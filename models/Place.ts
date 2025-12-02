import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IPlace {
  _id: Types.ObjectId;
  name: string;
  active: boolean;
  createdAt: Date;
}

const PlaceSchema = new Schema<IPlace>({
  name: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Place: Model<IPlace> =
  mongoose.models.Place || mongoose.model<IPlace>("Place", PlaceSchema);
