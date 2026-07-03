import { NextResponse } from "next/server";
import { chain } from "@/lib/api/composeRoute";
import { requireAuth, requireGroupAccess } from "@/lib/api/routeGuards";
import { SongList } from "@/models/SongList";

type ListSongsRouteParams = {
  groupId: string;
  listId: string;
};

type SongRef = {
  toString(): string;
};

export const POST = chain<ListSongsRouteParams>()
  .use(requireAuth)
  .use(requireGroupAccess)
  .handler(async (request, { params, session }) => {
    try {
      const { groupId, listId } = params;
      const { songId } = await request.json();

      if (!songId) {
        return NextResponse.json(
          { message: "ID пісні обов'язковий" },
          { status: 400 },
        );
      }

      const list = await SongList.findOne({ _id: listId, groupId });
      if (!list) {
        return NextResponse.json(
          { message: "Список пісень не знайдено" },
          { status: 404 },
        );
      }

      const exists = list.songs.some((song: SongRef) => isSameSong(song, songId));
      if (exists) {
        return NextResponse.json(
          { message: "Пісня вже є у списку" },
          { status: 400 },
        );
      }

      list.songs.push(songId);
      list.updatedBy = session.user.id;
      await list.save();

      return NextResponse.json({
        success: true,
        message: "Пісню додано до списку",
      });
    } catch (error) {
      console.error("Error adding song to list:", error);
      return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
    }
  });

export const DELETE = chain<ListSongsRouteParams>()
  .use(requireAuth)
  .use(requireGroupAccess)
  .handler(async (request, { params, session }) => {
    try {
      const { groupId, listId } = params;
      const songId = request.nextUrl.searchParams.get("songId");

      if (!songId) {
        return NextResponse.json(
          { message: "ID пісні обов'язковий" },
          { status: 400 },
        );
      }

      const list = await SongList.findOne({ _id: listId, groupId });
      if (!list) {
        return NextResponse.json(
          { message: "Список пісень не знайдено" },
          { status: 404 },
        );
      }

      const initialLength = list.songs.length;
      list.songs = list.songs.filter((song: SongRef) => !isSameSong(song, songId));

      if (list.songs.length === initialLength) {
        return NextResponse.json(
          { message: "Пісню не знайдено у списку" },
          { status: 404 },
        );
      }

      list.updatedBy = session.user.id;
      await list.save();

      return NextResponse.json({
        success: true,
        message: "Пісню видалено зі списку",
      });
    } catch (error) {
      console.error("Error removing song from list:", error);
      return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
    }
  });

function isSameSong(song: SongRef, songId: string) {
  return song.toString() === songId;
}
