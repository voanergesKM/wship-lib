import {
  HydratedDocument,
  InferSchemaType,
  Schema,
  model,
  models,
} from "mongoose";

const AssetSchema = new Schema(
  {
    title: String,
    tags: [String],

    image: {
      url: { type: String, required: true },
      publicId: { type: String },
    },

    telegram: {
      fileId: { type: String, required: true },
      chatId: { type: Number, required: true },
      userId: { type: Number, required: true },
    },
  },
  { timestamps: true },
);

export type AssetType = InferSchemaType<typeof AssetSchema>;

export type AssetDocument = HydratedDocument<AssetType>;

export const Asset = models.Asset || model("Asset", AssetSchema);
