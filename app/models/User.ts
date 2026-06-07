import {
  Schema,
  model,
  models,
  InferSchemaType,
  HydratedDocument,
} from "mongoose";

const UserSchema = new Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    username: String,
    firstName: String,
    lastName: String,
    languageCode: String,
    photoUrl: String,
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: String,
    role: {
      type: String,
      enum: ["admin", "editor", "viewer"],
      default: "viewer",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export type UserType = InferSchemaType<typeof UserSchema>;

export type UserDocument = HydratedDocument<UserType>;

export const User = models.User || model("User", UserSchema);
