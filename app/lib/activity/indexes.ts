export const ACTIVITY_INDEXES: [
  Record<string, 1 | -1>,
  { unique?: boolean; expireAfterSeconds?: number },
][] = [
  [{ eventId: 1 }, { unique: true }],
  [{ occurredAt: -1, _id: -1 }, {}],
  [{ actorId: 1, occurredAt: -1, _id: -1 }, {}],
  [{ groupId: 1, occurredAt: -1, _id: -1 }, {}],
  [{ action: 1, occurredAt: -1, _id: -1 }, {}],
  [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
];
