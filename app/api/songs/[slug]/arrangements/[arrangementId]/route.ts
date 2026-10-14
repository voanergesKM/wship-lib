import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { Arrangement } from "@/models/Arrangement";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; arrangementId: string }> },
) {
  const { arrangementId } = await params;
  await connectDB();

  const session = await getServerAuth();
  if (!session.authenticated || !session.user) {
    return NextResponse.json(
      { error: "Необхідно авторизуватися" },
      { status: 401 },
    );
  }

  const arrangement = await Arrangement.findById(arrangementId);
  if (!arrangement) {
    return NextResponse.json(
      { error: "Структуру не знайдено" },
      { status: 404 },
    );
  }

  const isCreator =
    arrangement.createdBy &&
    arrangement.createdBy.toString() === session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!isCreator && !isAdmin) {
    return NextResponse.json(
      { error: "Недостатньо прав для видалення цієї структури" },
      { status: 403 },
    );
  }

  await Arrangement.findByIdAndDelete(arrangementId);

  return NextResponse.json({ ok: true, message: "Структуру видалено" });
}
