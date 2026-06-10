import {
  HydratedDocument,
  InferSchemaType,
  model,
  models,
  Schema,
} from "mongoose";

const ArrangementItemSchema = new Schema(
  {
    section: {
      type: String,
      required: true,
    },

    repeat: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    _id: false,
  },
);

const ArrangementSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    items: {
      type: [ArrangementItemSchema],
      default: [],
    },

    song: { type: Schema.Types.ObjectId, ref: "Song" },
  },
  { timestamps: true },
);

export type ArrangementType = InferSchemaType<typeof ArrangementSchema>;

export type ArrangementDocument = HydratedDocument<ArrangementType>;

export const Arrangement =
  models.Arrangement || model("Arrangement", ArrangementSchema);
