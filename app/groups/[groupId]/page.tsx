import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { getServerAuth } from "@/lib/serverAuth";
import { getGroupDetails, getSongLists } from "@/lib/data/groups";
import {
  groupDetailsOptions,
  groupListsOptions,
} from "@/lib/queries/groupQueries";
import { GroupDetailsPage } from "./GroupDetailsPage";
import type { Metadata, ResolvingMetadata } from "next";
import { getGroupShareInfo } from "@/lib/data/groupMetadata";
import { createShareMetadata } from "@/lib/metadata";

export async function generateMetadata(
  { params }: { params: Promise<{ groupId: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { groupId } = await params;
  const group = await getGroupShareInfo(groupId);
  return createShareMetadata({
    title: group?.name ?? "Групу не знайдено",
    description: group ? `Група «${group.name}» у Worship Library.` : "Групу не знайдено.",
    url: `/groups/${groupId}`,
  }, parent);
}

export default async function Page({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const [{ groupId }, session] = await Promise.all([params, getServerAuth()]);
  const queryClient = getQueryClient();
  const userId = session.authenticated ? session.user?.id : null;

  if (userId) {
    await Promise.all([
      queryClient.prefetchQuery({
        ...groupDetailsOptions(groupId),
        queryFn: () => getGroupDetails(groupId, userId),
        retry: false,
      }),
      queryClient.prefetchQuery({
        ...groupListsOptions(groupId),
        queryFn: () => getSongLists(groupId, userId),
        retry: false,
      }),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GroupDetailsPage groupId={groupId} initialUserId={userId ?? null} />
    </HydrationBoundary>
  );
}
