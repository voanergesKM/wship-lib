import {
  Schema,
  model,
  models,
  InferSchemaType,
  HydratedDocument,
} from "mongoose";
import "./Group";
import "./SongList";
import "./User";

const ConductorSessionSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    listId: {
      type: Schema.Types.ObjectId,
      ref: "SongList",
      required: true,
    },
    conductorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    currentSongSlug: {
      type: String,
      required: true,
    },
    stepIndex: {
      type: Number,
      default: 0,
    },
    lastHeartbeatAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Allow only one active session per group
ConductorSessionSchema.index(
  { groupId: 1 },
  {
    unique: true,
    partialFilterExpression: { endedAt: null },
  },
);

// TTL index: auto delete session 4 hours after endedAt is set
ConductorSessionSchema.index(
  { endedAt: 1 },
  {
    expireAfterSeconds: 14400,
    partialFilterExpression: { endedAt: { $type: "date" } },
  },
);

export type ConductorSessionType = InferSchemaType<typeof ConductorSessionSchema>;
export type ConductorSessionDocument = HydratedDocument<ConductorSessionType>;

export const ConductorSession =
  models.ConductorSession || model("ConductorSession", ConductorSessionSchema);
