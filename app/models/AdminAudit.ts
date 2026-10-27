import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
} from "mongoose";
const schema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: {
    type: String,
    enum: [
      "admin.user.updated",
      "admin.profile.created",
      "admin.profile.updated",
    ],
    required: true,
  },
  targetId: { type: String, required: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  occurredAt: { type: Date, default: Date.now, required: true },
});
schema.index({ targetId: 1, occurredAt: -1 });
export type AdminAuditRecord = InferSchemaType<typeof schema>;
export const AdminAudit: Model<AdminAuditRecord> =
  (models.AdminAudit as Model<AdminAuditRecord> | undefined) ||
  model<AdminAuditRecord>("AdminAudit", schema);
