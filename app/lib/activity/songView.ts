import "server-only";
import { ActivityEvent, ActivityRateLimit } from "@/models/ActivityEvent";
import { Song } from "@/models/Song";
import { SongList } from "@/models/SongList";
import { Group } from "@/models/Group";
import { connectDB } from "@/lib/db";
import { AdminError } from "@/lib/admin/errors";
import { songViewSchema } from "./catalog";
import { persistActivity } from "./server";

export async function recordSongView(actorId: string, input: unknown) {
  const body = songViewSchema.parse(input);
  await connectDB();
  const song: {
    _id: { toString(): string };
    title: string;
    slug: string;
  } | null = await Song.findOne({ slug: body.slug })
    .select("_id title slug")
    .lean();
  if (!song) throw new AdminError("Пісню не знайдено", 404);
  if (
    body.groupId &&
    !(await Group.exists({ _id: body.groupId, "members.userId": actorId }))
  ) {
    throw new AdminError("Немає доступу до групи", 403);
  }
  if (
    body.listId &&
    !(await SongList.exists({
      _id: body.listId,
      groupId: body.groupId,
      songs: song._id,
    }))
  ) {
    throw new AdminError("Пісні немає в цьому списку", 404);
  }
  const eventId = `client:${actorId}:${body.eventId}`;
  if (await ActivityEvent.exists({ eventId })) return false;
  const now = Date.now();
  try {
    await ActivityRateLimit.findOneAndUpdate(
      {
        _id: `song-view:${actorId}:${Math.floor(now / 60000)}`,
        count: { $lt: 30 },
      },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date(now + 600000) },
      },
      { upsert: true },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AdminError("Забагато подій. Спробуйте пізніше", 429);
    }
    throw error;
  }
  return persistActivity(
    {
      action: "song.view",
      actorId,
      targetId: song._id.toString(),
      targetLabel: song.title.slice(0, 200),
      groupId: body.groupId,
      payload: {
        slug: song.slug,
        ...(body.listId ? { listId: body.listId } : {}),
      },
    },
    { source: "client", eventId },
  );
}
