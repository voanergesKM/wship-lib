import { UserState as UserStateModel } from "@/models/UserState";
import { STATE_STEPS } from "@/bot/contsants";
import { BotContext } from "@/types/telegram.types";

type StateDataMap = {
  idle: {};

  awaiting_photo: {};

  awaiting_meta: {
    fileId: string;
  };

  awaiting_search: {};
};

export type Step = (typeof STATE_STEPS)[keyof typeof STATE_STEPS];

export type UserState<TStep extends Step = Step> = {
  step: TStep;
  data: StateDataMap[TStep];
};

export type StateHandler = (ctx: BotContext, state: UserState) => Promise<void>;

export type ActiveStep = Exclude<Step, typeof STATE_STEPS.IDLE>;

export class StateMachine {
  static async get<TStep extends Step>(
    userId: number,
  ): Promise<UserState<TStep>> {
    const doc = await UserStateModel.findOne({ userId });

    return {
      step: doc?.step || STATE_STEPS.IDLE,
      data: doc?.data || {},
    } as UserState<TStep>;
  }

  static async set<TStep extends Step>(
    userId: number,
    step: TStep,
    data: StateDataMap[TStep],
  ) {
    await UserStateModel.findOneAndUpdate(
      { userId },
      {
        userId,
        step,
        data,
      },
      {
        upsert: true,
      },
    );
  }

  static async reset(userId: number) {
    await this.set(userId, STATE_STEPS.IDLE, {});
  }
}
