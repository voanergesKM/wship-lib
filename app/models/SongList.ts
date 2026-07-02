import {
  Schema,
  model,
  models,
  InferSchemaType,
  HydratedDocument,
} from "mongoose";

const SongListSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    songs: [
      {
        type: Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export type SongListType = InferSchemaType<typeof SongListSchema>;
export type SongListDocument = HydratedDocument<SongListType>;

export const SongList = models.SongList || model("SongList", SongListSchema);
