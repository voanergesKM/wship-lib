import {
  Schema,
  model,
  models,
  HydratedDocument,
  InferSchemaType,
} from "mongoose";

const SongProposalSchema = new Schema(
  {
    song: {
      type: Schema.Types.ObjectId,
      ref: "Song",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    proposedData: {
      title: {
        type: String,
        required: true,
        trim: true,
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
      youtube: [
        {
          _id: false,
          videoId: String,
          url: String,
        },
      ],
      visibility: {
        type: String,
        enum: ["private", "team", "public"],
        default: "public",
      },
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    reviewComment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export type SongProposalType = InferSchemaType<typeof SongProposalSchema>;
export type SongProposalDocument = HydratedDocument<SongProposalType>;

export const SongProposal =
  models.SongProposal || model("SongProposal", SongProposalSchema);
