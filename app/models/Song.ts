import { buildSearchText } from "@/utils/buildSearchText";
import {
  Schema,
  model,
  models,
  InferSchemaType,
  HydratedDocument,
} from "mongoose";

const SongSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    authors: {
      type: [String],
      default: [],
    },

    language: {
      type: String,
      default: "uk",
    },

    key: String,

    bpm: Number,

    document: {
      type: String,
      required: true,
    },

    searchText: {
      type: String,
    },

    youtube: {
      videoId: String,
      url: String,
    },

    visibility: {
      type: String,
      enum: ["private", "team", "public"],
      default: "public",
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

SongSchema.index({
  title: "text",
  tags: "text",
  searchText: "text",
});

SongSchema.pre("save", function () {
  this.searchText = buildSearchText(this);
});

SongSchema.pre("findOneAndUpdate", function () {
  this.set({ searchText: buildSearchText(this.getUpdate() as any) });
});

export type SongType = InferSchemaType<typeof SongSchema>;

export type SongDocument = HydratedDocument<SongType>;

export const Song = models.Song || model("Song", SongSchema);
