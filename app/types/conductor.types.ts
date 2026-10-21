export interface ConductorSessionState {
  _id: string;
  groupId: string;
  listId: string;
  conductorUserId: string;
  currentSongSlug: string;
  stepIndex: number;
  startedAt: string;
  endedAt: string | null;
  lastHeartbeatAt: string;
  isDisconnected: boolean;
}

export interface ConductorSessionCreatePayload {
  groupId: string;
  listId: string;
}

export interface ConductorSessionUpdatePayload {
  currentSongSlug?: string;
  stepIndex?: number;
}
