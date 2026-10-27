import { queryOptions } from "@tanstack/react-query";
import { groupsService } from "@/services/groups.service";

export const myGroupsOptions = queryOptions({
  queryKey: ["groups"],
  queryFn: groupsService.getMyGroups,
});

export const groupInvitationsOptions = queryOptions({
  queryKey: ["invitations"],
  queryFn: groupsService.getPendingInvitations,
});

export const groupDetailsOptions = (groupId: string) =>
  queryOptions({
    queryKey: ["group", groupId],
    queryFn: () => groupsService.getGroupDetails(groupId),
    enabled: Boolean(groupId),
  });

export const groupListsOptions = (groupId: string) =>
  queryOptions({
    queryKey: ["groupLists", groupId],
    queryFn: () => groupsService.getSongLists(groupId),
    enabled: Boolean(groupId),
  });

export const songListDetailsOptions = (groupId: string, listId: string) =>
  queryOptions({
    queryKey: ["songList", groupId, listId],
    queryFn: () => groupsService.getSongListDetails(groupId, listId),
    enabled: Boolean(groupId && listId),
  });
