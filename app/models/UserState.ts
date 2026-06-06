import { STATE_STEPS } from "@/bot/contsants";
import { Schema, model, models } from "mongoose";

const UserStateSchema = new Schema(
  {
    userId: { type: Number, unique: true },

    step: {
      type: String,
      default: STATE_STEPS.IDLE,
    },

    data: {
      type: Object,
      default: {},
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export const UserState =
  models.UserState || model("UserState", UserStateSchema);
