import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { getServerAuth } from "@/lib/serverAuth";
import { getMyGroups, getPendingInvitations } from "@/lib/data/groups";
import {
  myGroupsOptions,
  groupInvitationsOptions,
} from "@/lib/queries/groupQueries";
import { GroupsPage } from "./GroupsPage";

export default async function Page() {
  const session = await getServerAuth();
  const queryClient = getQueryClient();
  const user = session.authenticated ? session.user : null;

  if (user) {
    await Promise.all([
      queryClient.prefetchQuery({
        ...myGroupsOptions,
        queryFn: () => getMyGroups(user.id),
        retry: false,
      }),
      queryClient.prefetchQuery({
        ...groupInvitationsOptions,
        queryFn: () => getPendingInvitations(user),
        retry: false,
      }),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GroupsPage initialUserId={user?.id ?? null} />
    </HydrationBoundary>
  );
}
