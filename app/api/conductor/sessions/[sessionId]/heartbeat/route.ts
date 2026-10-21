import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { ConductorSession } from "@/models/ConductorSession";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(_request: NextRequest, { params }: RouteContext) {
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

    if (sessionDoc.conductorUserId.toString() !== auth.user.id) {
      return NextResponse.json(
        { message: "Тільки диригент може надсилати heartbeat" },
        { status: 403 },
      );
    }

    if (sessionDoc.endedAt) {
      return NextResponse.json({ message: "Сесія завершена" }, { status: 400 });
    }

    sessionDoc.lastHeartbeatAt = new Date();
    await sessionDoc.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating heartbeat:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
