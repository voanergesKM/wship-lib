import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { connectDB } from "@/lib/db";
import { recordActivitySafely } from "@/lib/activity/server";
import { Group } from "@/models/Group";

export async function POST(request: Request) {
  const session = await getServerAuth();
  if (!session.authenticated || !session.user)
    return NextResponse.json(
      { message: "Увійдіть, щоб приєднатися" },
      { status: 401 },
    );
  let token: unknown;
  try {
    ({ token } = await request.json());
  } catch {
    return NextResponse.json(
      { message: "Недійсне запрошення" },
      { status: 400 },
    );
  }
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token))
    return NextResponse.json(
      { message: "Недійсне запрошення" },
      { status: 400 },
    );
  await connectDB();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const match = {
    "inviteLink.tokenHash": tokenHash,
    "inviteLink.expiresAt": { $gt: new Date() },
  };
  const group = await Group.findOneAndUpdate(
    { ...match, "members.userId": { $ne: session.user.id } },
    { $push: { members: { userId: session.user.id, role: "member" } } },
    { returnDocument: "after" },
  );
  if (group) {
    await recordActivitySafely({
      action: "group.member.joined",
      actorId: session.user.id,
      targetId: session.user.id,
      groupId: String(group._id),
      payload: {},
    });
    return NextResponse.json({
      groupId: String(group._id),
      alreadyMember: false,
    });
  }
  const existing = await Group.findOne({
    ...match,
    "members.userId": session.user.id,
  }).select("_id");
  if (existing)
    return NextResponse.json({
      groupId: String(existing._id),
      alreadyMember: true,
    });
  return NextResponse.json(
    { message: "Посилання прострочене або відкликане" },
    { status: 410 },
  );
}
