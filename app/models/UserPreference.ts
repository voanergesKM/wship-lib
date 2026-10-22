import { InferSchemaType, Schema, model, models } from "mongoose";

const SongDisplayPreferencesSchema = new Schema(
  {
    fontSize: { type: Number, min: 10, max: 24, default: 14 },
    showChords: { type: Boolean, default: true },
  },
  { _id: false },
);

const UserPreferenceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    version: { type: Number, default: 1 },
    songDisplay: { type: SongDisplayPreferencesSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export type UserPreferenceType = InferSchemaType<typeof UserPreferenceSchema>;

export const UserPreference =
  models.UserPreference || model("UserPreference", UserPreferenceSchema);
