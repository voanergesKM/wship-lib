import "server-only";
import { randomUUID } from "node:crypto";
import type { ClientSession } from "mongoose";
import { ActivityEvent } from "@/models/ActivityEvent";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import { validateActivity, type ActivityInput } from "./catalog";
export const VIEW_RETENTION_DAYS = 90;
function duplicate(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function persistActivity(
  input: ActivityInput,
  options: {
    source: "server" | "client";
    eventId: string;
    session?: ClientSession;
  },
) {
  const data = validateActivity(input);
  const now = new Date();
  await connectDB();
  let inserted: boolean;
  try {
    const result = await ActivityEvent.updateOne(
      { eventId: options.eventId },
      {
        $setOnInsert: {
          ...data,
          eventId: options.eventId,
          source: options.source,
          occurredAt: now,
          ...(data.action === "song.view"
            ? {
                expiresAt: new Date(
                  now.getTime() + VIEW_RETENTION_DAYS * 86400000,
                ),
              }
            : {}),
        },
      },
      {
        upsert: true,
        ...(options.session ? { session: options.session } : {}),
      },
    );
    inserted = result.upsertedCount === 1;
  } catch (error) {
    // Never swallow errors inside a transaction: MongoDB may have aborted it.
    if (!options.session && duplicate(error)) return false;
    throw error;
  }
  if (inserted && data.actorId) {
    await User.updateOne(
      {
        _id: data.actorId,
        isActive: true,
        $or: [
          { lastSeenAt: null },
          { lastSeenAt: { $lt: new Date(now.getTime() - 60000) } },
        ],
      },
      { $max: { lastSeenAt: now } },
      options.session ? { session: options.session } : {},
    );
  }
  return inserted;
}

export async function recordActivity(
  input: ActivityInput,
  options: { eventId?: string; session?: ClientSession } = {},
) {
  return persistActivity(input, {
    source: "server",
    eventId: `server:${options.eventId ?? randomUUID()}`,
    session: options.session,
  });
}

// Ordinary activity must not turn a committed operation into a failed response.
// Administrative/chord transactional history uses the strict writer instead.
export async function recordActivitySafely(
  input: ActivityInput,
  options: { eventId?: string } = {},
) {
  try {
    return await recordActivity(input, options);
  } catch (error) {
    console.error("Activity recording failed", input.action, error);
    return false;
  }
}

export async function recordAdminAuditActivity(
  audit: {
    _id: { toString(): string };
    actorId: { toString(): string } | string;
    action:
      | "admin.user.updated"
      | "admin.profile.created"
      | "admin.profile.updated";
    targetId: string;
  },
  session: ClientSession,
) {
  await recordActivity(
    {
      action: audit.action,
      actorId: audit.actorId.toString(),
      targetId: audit.targetId,
      payload: {},
    },
    {
      eventId: `admin-audit:${audit._id.toString()}`,
      session,
    },
  );
}
