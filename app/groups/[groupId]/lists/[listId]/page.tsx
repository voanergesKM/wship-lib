import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { getServerAuth } from "@/lib/serverAuth";
import { getGroupDetails, getSongListDetails } from "@/lib/data/groups";
import {
  groupDetailsOptions,
  songListDetailsOptions,
} from "@/lib/queries/groupQueries";
import { SongListPage } from "./SongListPage";

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
