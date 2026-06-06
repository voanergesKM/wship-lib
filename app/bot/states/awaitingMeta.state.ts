import { saveAssetFromTelegram } from "@/services/saveAssetFromTelegram";
import { parseTags } from "@/utils/parse-tags";
import { finishAddFlow } from "../actions";
import { UserState, StateHandler } from "@/lib/state-machine";

export const awaitingMetaState: StateHandler = async (ctx, state) => {
  const metaState = state as UserState<"awaiting_meta">;

  const fileId = metaState.data.fileId;

  const { tags, title } = parseTags(ctx.text);

  const { chat, from } = ctx;

  await saveAssetFromTelegram({
    fileId,
    title,
    tags,
    chatId: chat.id,
    userId: from.id,
  });

  await finishAddFlow(chat.id, from.id);
};
