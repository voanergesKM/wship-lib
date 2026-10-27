import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { getServerAuth } from "@/lib/serverAuth";
import { getGroupDetails, getSongListDetails } from "@/lib/data/groups";
import {
  groupDetailsOptions,
  songListDetailsOptions,
} from "@/lib/queries/groupQueries";
import { SongListPage } from "./SongListPage";
import type { Metadata, ResolvingMetadata } from "next";
import { getSongListShareInfo } from "@/lib/data/groupMetadata";
import { createShareMetadata } from "@/lib/metadata";

export async function generateMetadata(
  { params }: { params: Promise<{ groupId: string; listId: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { groupId, listId } = await params;
  const list = await getSongListShareInfo(groupId, listId);
  return createShareMetadata({
    title: list ? `${list.name} • ${list.groupName}` : "Список пісень не знайдено",
    description: list
      ? `Список пісень «${list.name}» групи «${list.groupName}».`
      : "Список пісень не знайдено.",
    url: `/groups/${groupId}/lists/${listId}`,
  }, parent);
}

export default async function Page({
  params,
}: {
  params: Promise<{ groupId: string; listId: string }>;
}) {
  const [{ groupId, listId }, session] = await Promise.all([
    params,
    getServerAuth(),
  ]);
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
        ...songListDetailsOptions(groupId, listId),
        queryFn: () => getSongListDetails(groupId, listId, userId),
        retry: false,
      }),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SongListPage
        groupId={groupId}
        listId={listId}
        initialUserId={userId ?? null}
      />
    </HydrationBoundary>
  );
}
