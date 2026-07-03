import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { Group, type GroupDocument } from "@/models/Group";
import type { RouteContext, RouteGuard, RouteParams } from "./composeRoute";

type ServerAuth = Awaited<ReturnType<typeof getServerAuth>>;

export type AuthenticatedUser = NonNullable<ServerAuth["user"]>;

export type AuthenticatedSession = ServerAuth & {
  authenticated: true;
  user: AuthenticatedUser;
};

export type AuthRouteState = {
  session: AuthenticatedSession;
};

export type GroupRouteParams = RouteParams & {
  groupId: string;
};

export type GroupAccessRouteState = {
  group: GroupDocument;
};

type MemberUserRef = {
  toString(): string;
  _id?: {
    toString(): string;
  };
};

type GroupMember = {
  userId?: MemberUserRef | null;
};

export async function requireAuth<TParams extends RouteParams>(
  context: RouteContext<TParams>,
): Promise<Response | AuthRouteState>;

export async function requireAuth(): Promise<Response | AuthRouteState> {
  const session = await getServerAuth();

  if (!session || !session.authenticated || !session.user) {
    return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
  }

  return {
    session: session as AuthenticatedSession,
  };
}

export const requireGroupAccess: RouteGuard<
  GroupRouteParams,
  AuthRouteState,
  GroupAccessRouteState
> = async ({ params, session }) => {
  await connectDB();

  const group = await Group.findById(params.groupId);
  if (!group) {
    return NextResponse.json({ message: "Групу не знайдено" }, { status: 404 });
  }

  const isMember = group.members.some((member: GroupMember) =>
    isSameUser(member.userId, session.user.id),
  );

  if (!isMember) {
    return NextResponse.json(
      { message: "Немає доступу до цієї групи" },
      { status: 403 },
    );
  }

  return {
    group,
  };
};

function isSameUser(memberUserId: MemberUserRef | null | undefined, userId: string) {
  if (!memberUserId) {
    return false;
  }

  return (
    memberUserId.toString() === userId ||
    memberUserId._id?.toString() === userId
  );
}
