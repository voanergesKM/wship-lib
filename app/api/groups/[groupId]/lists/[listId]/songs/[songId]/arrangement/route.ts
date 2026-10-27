import { recordActivitySafely } from "@/lib/activity/server";
import { NextResponse } from "next/server";
import { chain } from "@/lib/api/composeRoute";
import { requireAuth, requireGroupAccess } from "@/lib/api/routeGuards";
import { SongList } from "@/models/SongList";
import "@/models/Arrangement";
import "@/models/Song";

type SongArrangementRouteParams = {
  groupId: string;
  listId: string;
  songId: string;
};

export const PATCH = chain<SongArrangementRouteParams>()
  .use(requireAuth)
  .use(requireGroupAccess)
  .handler(async (request, { params, session }) => {
    try {
      const { groupId, listId, songId } = params;
      const { arrangementId } = await request.json();

      const list = await SongList.findOne({ _id: listId, groupId });
      if (!list) {
        return NextResponse.json(
          { message: "Список пісень не знайдено" },
          { status: 404 },
        );
      }

      if (!list.songArrangements) {
        list.songArrangements = [];
      }

      // Remove any existing arrangement for this song
      list.songArrangements = list.songArrangements.filter(
        (sa: { song: { toString(): string } }) => sa.song.toString() !== songId,
      );

      // If arrangementId is provided, add it
      if (arrangementId) {
        list.songArrangements.push({
          song: songId,
          arrangement: arrangementId,
        });
      }

      list.updatedBy = session.user.id;
      await list.save();
      await recordActivitySafely({
        action: "playlist.arrangement.updated",
        actorId: session.user.id,
        targetId: String(listId),
        targetLabel: String(list.name).slice(0, 200),
        groupId: String(groupId),
        payload: {
          songId,
          arrangementId: arrangementId ? String(arrangementId) : null,
        },
      });

      const updatedList = await SongList.findById(list._id)
        .populate("songs")
        .populate("songArrangements.arrangement");

      return NextResponse.json({
        success: true,
        message: "Структуру для пісні оновлено",
        list: updatedList,
      });
    } catch (error) {
      console.error("Error setting song arrangement in list:", error);
      return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
    }
  });
