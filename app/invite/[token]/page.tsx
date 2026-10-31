import { createHash } from "node:crypto";
import type { Metadata, ResolvingMetadata } from "next";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { getServerAuth } from "@/lib/serverAuth";
import { getGroupInviteShareInfo } from "@/lib/data/groupMetadata";
import { createShareMetadata } from "@/lib/metadata";
import { InvitePage } from "./InvitePage";

export const dynamic = "force-dynamic";
export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { token } = await params;
  const group = await getGroupInviteShareInfo(token);
  const title = group
    ? `Запрошення до групи «${group.name}»`
    : "Запрошення до групи";
  const description = group
    ? `Приєднуйтеся до групи «${group.name}» у Worship Library. Посилання діє одну добу.`
    : "Посилання на запрошення недійсне або термін його дії завершився.";
  return {
    ...(await createShareMetadata(
      { title, description, url: `/invite/${encodeURIComponent(token)}` },
      parent,
    )),
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token))
    return <InvitePage token={token} group={null} />;
  await connectDB();
  const [group, session] = await Promise.all([
    Group.findOne({
      "inviteLink.tokenHash": createHash("sha256").update(token).digest("hex"),
      "inviteLink.expiresAt": { $gt: new Date() },
    })
      .select("name members.userId")
      .lean(),
    getServerAuth(),
  ]);
  const userId = session.user?.id;
  const details = group
    ? {
        id: String(group._id),
        name: String(group.name),
        sessionUserId: userId ?? null,
        alreadyMember: Boolean(
          userId &&
          group.members.some(
            (member: { userId: { toString(): string } }) =>
              member.userId?.toString() === userId,
          ),
        ),
      }
    : null;
  return <InvitePage token={token} group={details} />;
}
