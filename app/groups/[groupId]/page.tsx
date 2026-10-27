import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { getServerAuth } from "@/lib/serverAuth";
import { getGroupDetails, getSongLists } from "@/lib/data/groups";
import {
  groupDetailsOptions,
  groupListsOptions,
} from "@/lib/queries/groupQueries";
import { GroupDetailsPage } from "./GroupDetailsPage";

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
