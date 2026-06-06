import {
  awaitingSearchState,
  awaitingPhotoState,
  awaitingMetaState,
} from "../states";
import { STATE_STEPS } from "../contsants";
import { ActiveStep, StateHandler } from "@/lib/state-machine";

export const stateRegistry: Record<ActiveStep, StateHandler> = {
  [STATE_STEPS.AWAITING_PHOTO]: awaitingPhotoState,
  [STATE_STEPS.AWAITING_META]: awaitingMetaState,
  [STATE_STEPS.AWAITING_SEARCH]: awaitingSearchState,
};
