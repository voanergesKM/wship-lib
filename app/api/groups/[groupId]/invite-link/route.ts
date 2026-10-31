import { randomBytes, createHash } from "node:crypto";
import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";

async function authorize(groupId: string) {
  const session = await getServerAuth();
  if (!session.authenticated || !session.user)
    return {
      error: NextResponse.json({ message: "Неавторизовано" }, { status: 401 }),
    };
  if (!isValidObjectId(groupId))
    return {
      error: NextResponse.json(
        { message: "Групу не знайдено" },
        { status: 404 },
      ),
    };
  await connectDB();
  const group = await Group.findOne({
    _id: groupId,
    members: {
      $elemMatch: {
        userId: session.user.id,
        role: { $in: ["owner", "admin"] },
      },
    },
  }).select("+inviteLink");
  if (!group)
    return {
      error: NextResponse.json(
        { message: "Немає доступу до керування запрошеннями" },
        { status: 403 },
      ),
    };
  return { group, userId: session.user.id };
}

type Context = { params: Promise<{ groupId: string }> };
export async function GET(_request: Request, { params }: Context) {
  const { groupId } = await params;
  const result = await authorize(groupId);
  if (result.error) return result.error;
  const link = result.group.inviteLink;
  return NextResponse.json(
    { expiresAt: link && link.expiresAt > new Date() ? link.expiresAt : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(_request: Request, { params }: Context) {
  const { groupId } = await params;
  const result = await authorize(groupId);
  if (result.error) return result.error;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const updated = await Group.updateOne(
    {
      _id: groupId,
      members: {
        $elemMatch: {
          userId: result.userId,
          role: { $in: ["owner", "admin"] },
        },
      },
    },
    {
      $set: {
        inviteLink: {
          tokenHash: createHash("sha256").update(token).digest("hex"),
          expiresAt,
        },
      },
    },
  );
  if (!updated.matchedCount)
    return NextResponse.json({ message: "Немає доступу" }, { status: 403 });
  return NextResponse.json(
    { token, expiresAt },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(_request: Request, { params }: Context) {
  const { groupId } = await params;
  const result = await authorize(groupId);
  if (result.error) return result.error;
  const updated = await Group.updateOne(
    {
      _id: groupId,
      members: {
        $elemMatch: {
          userId: result.userId,
          role: { $in: ["owner", "admin"] },
        },
      },
    },
    { $unset: { inviteLink: 1 } },
  );
  if (!updated.matchedCount)
    return NextResponse.json({ message: "Немає доступу" }, { status: 403 });
  return NextResponse.json({ success: true });
}
