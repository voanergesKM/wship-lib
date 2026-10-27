import { randomUUID } from "node:crypto";
import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
} from "mongoose";
import { PERMISSION_KEYS } from "@/lib/permissions/catalog";

const schema = new Schema(
  {
    _id: { type: String, default: randomUUID },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", maxlength: 500 },
    permissions: { type: [String], enum: PERMISSION_KEYS, default: [] },
    isSystem: { type: Boolean, default: false, immutable: true },
    revision: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type PermissionProfileRecord = InferSchemaType<typeof schema>;
export const PermissionProfile: Model<PermissionProfileRecord> =
  (models.PermissionProfile as Model<PermissionProfileRecord> | undefined) ||
  model<PermissionProfileRecord>("PermissionProfile", schema);
