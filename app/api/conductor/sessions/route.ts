import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { Group } from "@/models/Group";
import { SongList } from "@/models/SongList";
import { ConductorSession } from "@/models/ConductorSession";
import { notificationService } from "@/services/notification.service";

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuth();
    if (!auth?.authenticated || !auth.user) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, listId } = body || {};

    if (!groupId || !listId) {
      return NextResponse.json(
        { message: "groupId та listId є обов'язковими" },
        { status: 400 },
      );
    }

    await connectDB();

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: "Групу не знайдено" }, { status: 404 });
    }

    const member = group.members.find(
      (m: any) =>
        m.userId?.toString() === auth.user.id ||
        m.userId?._id?.toString() === auth.user.id,
    );

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json(
        { message: "Лише адміністратори або власники можуть диригувати" },
        { status: 403 },
      );
    }

    const list = await SongList.findById(listId).populate("songs");
    if (!list || list.groupId.toString() !== groupId) {
      return NextResponse.json({ message: "Список пісень не знайдено" }, { status: 404 });
    }

    if (!list.songs || list.songs.length === 0) {
      return NextResponse.json(
        { message: "Список не містить жодної пісні" },
        { status: 400 },
      );
    }

    // Check if every song has an assigned arrangement
    const songsWithoutArrangement = (list.songs as any[]).filter((song) => {
      const songId = song._id ? song._id.toString() : song.toString();
      return !list.songArrangements?.some(
        (sa: any) =>
          sa.arrangement &&
          (sa.song?._id ? sa.song._id.toString() : sa.song?.toString()) === songId,
      );
    });

    if (songsWithoutArrangement.length > 0) {
      return NextResponse.json(
        {
          message: "Не всі пісні мають призначену структуру",
          missingSongs: songsWithoutArrangement.map((s: any) => ({
            _id: s._id?.toString() || s.toString(),
            title: s.title || "Без назви",
          })),
        },
        { status: 400 },
      );
    }

    // Check existing active session
    const existingSession = await ConductorSession.findOne({
      groupId,
      endedAt: null,
    });

    if (existingSession) {
      const isStale =
        Date.now() - new Date(existingSession.lastHeartbeatAt).getTime() > 20_000;
      const isSameConductor =
        existingSession.conductorUserId.toString() === auth.user.id;

      if (isStale || isSameConductor) {
        existingSession.endedAt = new Date();
        await existingSession.save();
      } else {
        return NextResponse.json(
          {
            message: "Сесія для цієї групи вже активна",
            sessionId: existingSession._id.toString(),
          },
          { status: 409 },
        );
      }
    }

    const firstSong = list.songs[0] as any;
    const currentSongSlug = firstSong.slug;

    const newSession = await ConductorSession.create({
      groupId,
      listId,
      conductorUserId: auth.user.id,
      currentSongSlug,
      stepIndex: 0,
      lastHeartbeatAt: new Date(),
      startedAt: new Date(),
      endedAt: null,
    });

    notificationService
      .notifyConductorSessionStarted({
        groupId,
        listId,
        listName: list.name,
        sessionId: newSession._id.toString(),
        conductorName:
          auth.user.firstName || auth.user.username || "Диригент",
      })
      .catch((err) => {
        console.error("Failed to notify conductor session started:", err);
      });

    return NextResponse.json(
      {
        sessionId: newSession._id.toString(),
        currentSongSlug,
        stepIndex: 0,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating conductor session:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { message: "groupId є обов'язковим" },
        { status: 400 },
      );
    }

    await connectDB();

    const sessionDoc = await ConductorSession.findOne({
      groupId,
      endedAt: null,
    }).sort({ createdAt: -1 });

    if (!sessionDoc) {
      return NextResponse.json(null);
    }

    const isDisconnected =
      Date.now() - new Date(sessionDoc.lastHeartbeatAt).getTime() > 20_000;

    return NextResponse.json({
      _id: sessionDoc._id.toString(),
      groupId: sessionDoc.groupId.toString(),
      listId: sessionDoc.listId.toString(),
      conductorUserId: sessionDoc.conductorUserId.toString(),
      currentSongSlug: sessionDoc.currentSongSlug,
      stepIndex: sessionDoc.stepIndex,
      startedAt: sessionDoc.startedAt.toISOString(),
      endedAt: sessionDoc.endedAt ? sessionDoc.endedAt.toISOString() : null,
      lastHeartbeatAt: sessionDoc.lastHeartbeatAt.toISOString(),
      isDisconnected,
    });
  } catch (error) {
    console.error("Error fetching conductor session:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
