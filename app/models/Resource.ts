import {
  Schema,
  model,
  models,
  InferSchemaType,
  HydratedDocument,
} from "mongoose";

const ResourceSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    tags: [String],
    image: {
      publicId: {
        type: String,
        required: true,
      },
      secureUrl: {
        type: String,
        required: true,
      },
    },
    telegram: {
      fileId: {
        type: String,
        required: true,
      },
      userId: {
        type: Number,
        required: true,
      },
      chatId: {
        type: Number,
        required: true,
      },
    },
    youtube: {
      videoId: String,
    },
  },
  { timestamps: true },
);

export type ResourceType = InferSchemaType<typeof ResourceSchema>;

export type ResourceDocument = HydratedDocument<ResourceType>;

export const Resource = models.Resource || model("Resource", ResourceSchema);
