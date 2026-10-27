import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
} from "mongoose";
import { ACTIVITY_INDEXES } from "@/lib/activity/indexes";
import { ACTIVITY_KEYS } from "@/lib/activity/catalog";
const schema = new Schema(
  {
    eventId: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, enum: ACTIVITY_KEYS, required: true },
    category: { type: String, required: true },
    targetKind: { type: String, required: true },
    targetId: { type: String, required: true },
    targetLabel: { type: String, maxlength: 200 },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    payload: { type: Schema.Types.Mixed, required: true },
    source: { type: String, enum: ["server", "client"], required: true },
    occurredAt: { type: Date, required: true },
    expiresAt: { type: Date },
  },
  { minimize: false },
);
for (const [keys, options] of ACTIVITY_INDEXES) schema.index(keys, options);
export type ActivityEventRecord = InferSchemaType<typeof schema>;
export const ActivityEvent: Model<ActivityEventRecord> =
  (models.ActivityEvent as Model<ActivityEventRecord> | undefined) ||
  model<ActivityEventRecord>("ActivityEvent", schema);

const rateSchema = new Schema({
  _id: { type: String, required: true },
  count: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
});
rateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
type ActivityRateRecord = InferSchemaType<typeof rateSchema>;
export const ActivityRateLimit: Model<ActivityRateRecord> =
  (models.ActivityRateLimit as Model<ActivityRateRecord> | undefined) ||
  model<ActivityRateRecord>("ActivityRateLimit", rateSchema);
