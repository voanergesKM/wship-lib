import { Schema, model, models, InferSchemaType, HydratedDocument } from "mongoose";

const AuthSessionSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // 10 minutes in seconds
    },
  },
  { timestamps: true }
);

export type AuthSessionType = InferSchemaType<typeof AuthSessionSchema>;
export type AuthSessionDocument = HydratedDocument<AuthSessionType>;

export const AuthSession = models.AuthSession || model("AuthSession", AuthSessionSchema);
