import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { getPendingInvitations } from "@/lib/data/groups";

export async function GET() {
  try {
    const session = await getServerAuth();
    if (!session.authenticated || !session.user) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    return NextResponse.json(await getPendingInvitations(session.user));
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
