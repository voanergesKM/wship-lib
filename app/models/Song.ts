import slugify from "slugify";
import { nanoid } from "nanoid";
import {
  Schema,
  model,
  models,
  InferSchemaType,
  HydratedDocument,
} from "mongoose";
import { buildSearchText } from "@/utils/buildSearchText";
import { YouTubeLink } from "@/utils/youtubeLinks";

type SongUpdate = {
  title?: string;
  tags?: string[];
  authors?: string[];
  document?: string;
  youtube?: YouTubeLink[];
  slug?: string;
  searchText?: string;
  $set?: SongUpdate;
  [key: string]: unknown;
};

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
      type: [
        {
          videoId: String,
          url: String,
        },
      ],
      default: [],
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

SongSchema.pre("validate", function () {
  if (!this.isNew && !this.isModified("title")) {
    return;
  }

  this.slug = `${slugify(this.title, {
    lower: true,
    strict: true,
    locale: "uk",
  })}-${nanoid(6)}`;
});

SongSchema.pre("save", function () {
  this.searchText = buildSearchText(this);
});

SongSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() as SongUpdate | null;

  if (!update || Array.isArray(update)) {
    return;
  }

  const fields = update.$set ?? update;

  if (fields.title) {
    fields.slug = `${slugify(fields.title, {
      lower: true,
      strict: true,
      locale: "uk",
    })}-${nanoid(6)}`;
  }

  fields.searchText = buildSearchText(fields);
});

export type SongType = InferSchemaType<typeof SongSchema>;

export type SongDocument = HydratedDocument<SongType>;

export const Song = models.Song || model("Song", SongSchema);
