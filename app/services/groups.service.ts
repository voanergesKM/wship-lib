import { baseFetcher } from "@/utils/baseFetcher";

export interface GroupMember {
  userId: {
    _id: string;
    firstName: string;
    username?: string;
    email?: string;
    photoUrl?: string;
  };
  role: "owner" | "admin" | "member";
}

export interface GroupInvitation {
  type: "telegram" | "email";
  value: string;
  role: "admin" | "member";
  invitedBy: {
    _id: string;
    firstName: string;
    username?: string;
  };
  createdAt: string;
}

export interface GroupData {
  _id: string;
  name: string;
  members: GroupMember[];
  invitations: GroupInvitation[];
  createdBy: {
    _id: string;
    firstName: string;
    username?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserInvitationInfo {
  groupId: string;
  groupName: string;
  createdBy: {
    _id: string;
    firstName: string;
    username?: string;
  };
  role: "admin" | "member";
  invitedBy: {
    _id: string;
    firstName: string;
    username?: string;
  };
  createdAt: string;
}

export interface SongListDetails {
  _id: string;
  name: string;
  groupId: string;
  songs: any[]; // Populated songs
  createdBy: {
    _id: string;
    firstName: string;
    username?: string;
  };
  updatedBy: {
    _id: string;
    firstName: string;
    username?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const groupsService = {
  getMyGroups: () => {
    return baseFetcher<GroupData[]>("/groups", { method: "GET" });
  },

  createGroup: (name: string) => {
    return baseFetcher<GroupData>("/groups", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  getGroupDetails: (groupId: string) => {
    return baseFetcher<GroupData>(`/groups/${groupId}`, { method: "GET" });
  },

  deleteGroup: (groupId: string) => {
    return baseFetcher<{ success: boolean; message: string }>(`/groups/${groupId}`, {
      method: "DELETE",
    });
  },

  getPendingInvitations: () => {
    return baseFetcher<UserInvitationInfo[]>("/groups/invitations", { method: "GET" });
  },

  acceptInvitation: (groupId: string) => {
    return baseFetcher<{ success: boolean; message: string }>("/groups/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ groupId }),
    });
  },

  rejectInvitation: (groupId: string) => {
    return baseFetcher<{ success: boolean; message: string }>("/groups/invitations/reject", {
      method: "POST",
      body: JSON.stringify({ groupId }),
    });
  },

  inviteUser: (
    groupId: string,
    type: "telegram" | "email",
    value: string,
    role: "admin" | "member"
  ) => {
    return baseFetcher<{ success: boolean; message: string }>(`/groups/${groupId}/invite`, {
      method: "POST",
      body: JSON.stringify({ type, value, role }),
    });
  },

  cancelInvitation: (groupId: string, type: "telegram" | "email", value: string) => {
    return baseFetcher<{ success: boolean; message: string }>(`/groups/${groupId}/invite`, {
      method: "DELETE",
      body: JSON.stringify({ type, value }),
    });
  },

  removeMember: (groupId: string, memberUserId: string) => {
    return baseFetcher<{ success: boolean; message: string }>(
      `/groups/${groupId}/members/${memberUserId}`,
      { method: "DELETE" }
    );
  },

  getSongLists: (groupId: string) => {
    return baseFetcher<SongListDetails[]>(`/groups/${groupId}/lists`, { method: "GET" });
  },

  createSongList: (groupId: string, name: string, songId?: string) => {
    return baseFetcher<SongListDetails>(`/groups/${groupId}/lists`, {
      method: "POST",
      body: JSON.stringify({ name, songId }),
    });
  },

  getSongListDetails: (groupId: string, listId: string) => {
    return baseFetcher<SongListDetails>(`/groups/${groupId}/lists/${listId}`, { method: "GET" });
  },

  updateSongList: (
    groupId: string,
    listId: string,
    payload: { name?: string; songs?: string[] }
  ) => {
    return baseFetcher<SongListDetails>(`/groups/${groupId}/lists/${listId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteSongList: (groupId: string, listId: string) => {
    return baseFetcher<{ success: boolean; message: string }>(
      `/groups/${groupId}/lists/${listId}`,
      { method: "DELETE" }
    );
  },

  addSongToList: (groupId: string, listId: string, songId: string) => {
    return baseFetcher<{ success: boolean; message: string }>(
      `/groups/${groupId}/lists/${listId}/songs`,
      {
        method: "POST",
        body: JSON.stringify({ songId }),
      }
    );
  },

  removeSongFromList: (groupId: string, listId: string, songId: string) => {
    return baseFetcher<{ success: boolean; message: string }>(
      `/groups/${groupId}/lists/${listId}/songs?songId=${songId}`,
      { method: "DELETE" }
    );
  },

  updateEmail: (email: string) => {
    return baseFetcher<{ success: boolean; email: string }>("/users/profile", {
      method: "PATCH",
      body: JSON.stringify({ email }),
    });
  },
};
