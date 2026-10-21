import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { ConductorSession } from "@/models/ConductorSession";
import { Group } from "@/models/Group";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { sessionId } = await params;
    await connectDB();

    const sessionDoc = await ConductorSession.findById(sessionId);
    if (!sessionDoc) {
      return NextResponse.json(
        { message: "Сесію не знайдено" },
        { status: 404 },
      );
    }

    const isDisconnected =
      !sessionDoc.endedAt &&
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
    console.error("Error fetching session state:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await getServerAuth();
    if (!auth?.authenticated || !auth.user) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await request.json();

    await connectDB();

    const sessionDoc = await ConductorSession.findById(sessionId);
    if (!sessionDoc) {
      return NextResponse.json(
        { message: "Сесію не знайдено" },
        { status: 404 },
      );
    }

    if (sessionDoc.conductorUserId.toString() !== auth.user.id) {
      return NextResponse.json(
        { message: "Тільки диригент може оновлювати стан сесії" },
        { status: 403 },
      );
    }

    if (sessionDoc.endedAt) {
      return NextResponse.json(
        { message: "Сесію вже завершено" },
        { status: 400 },
      );
    }

    if (typeof body.currentSongSlug === "string") {
      sessionDoc.currentSongSlug = body.currentSongSlug;
    }

    if (typeof body.stepIndex === "number") {
      sessionDoc.stepIndex = body.stepIndex;
    }

    sessionDoc.lastHeartbeatAt = new Date();
    await sessionDoc.save();

    return NextResponse.json({
      _id: sessionDoc._id.toString(),
      groupId: sessionDoc.groupId.toString(),
      listId: sessionDoc.listId.toString(),
      conductorUserId: sessionDoc.conductorUserId.toString(),
      currentSongSlug: sessionDoc.currentSongSlug,
      stepIndex: sessionDoc.stepIndex,
      startedAt: sessionDoc.startedAt.toISOString(),
      endedAt: null,
      lastHeartbeatAt: sessionDoc.lastHeartbeatAt.toISOString(),
      isDisconnected: false,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await getServerAuth();
    if (!auth?.authenticated || !auth.user) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const { sessionId } = await params;
    await connectDB();

    const sessionDoc = await ConductorSession.findById(sessionId);
    if (!sessionDoc) {
      return NextResponse.json(
        { message: "Сесію не знайдено" },
        { status: 404 },
      );
    }

    let canEnd = sessionDoc.conductorUserId.toString() === auth.user.id;
    if (!canEnd) {
      const group = await Group.findById(sessionDoc.groupId);
      const member = group?.members.find(
        (m: any) =>
          m.userId?.toString() === auth.user.id ||
          m.userId?._id?.toString() === auth.user.id,
      );
      if (member && ["owner", "admin"].includes(member.role)) {
        canEnd = true;
      }
    }

    if (!canEnd) {
      return NextResponse.json(
        { message: "Недостатньо прав для завершення сесії" },
        { status: 403 },
      );
    }

    sessionDoc.endedAt = new Date();
    await sessionDoc.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
