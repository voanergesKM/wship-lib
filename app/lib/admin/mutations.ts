import "server-only";
import { isObjectIdOrHexString } from "mongoose";
import { connectDB } from "@/lib/db";
import { User, type UserDocument } from "@/models/User";
import { PermissionProfile } from "@/models/PermissionProfile";
import { AdminAudit } from "@/models/AdminAudit";
import {
  can,
  SUPERADMIN_PROFILE_ID,
  type PermissionAccess,
} from "@/lib/permissions/catalog";
import { getUserAccess } from "@/lib/permissions/server";
import { AdminError } from "./errors";
import { userUpdateSchema, profileInputSchema } from "./validation";

type Actor = PermissionAccess & { id: string };

export async function updateAdminUser(
  actor: Actor,
  id: string,
  input: unknown,
) {
  const changes = userUpdateSchema.parse(input);
  if (!isObjectIdOrHexString(id))
    throw new AdminError("Користувача не знайдено", 404);
  const db = await connectDB();
  const session = await db.startSession();
  try {
    await session.withTransaction(async () => {
      // Serialize access changes through one document to prevent concurrent
      // demotions/disabling from removing every active superadmin.
      const root = await PermissionProfile.findOneAndUpdate(
        { _id: SUPERADMIN_PROFILE_ID, isSystem: true },
        { $inc: { revision: 1 } },
        { session },
      );
      if (!root)
        throw new AdminError(
          "Спочатку виконайте міграцію профілів доступу",
          409,
        );
      const currentActor: UserDocument | null = await User.findById(
        actor.id,
      ).session(session);
      if (!currentActor?.isActive)
        throw new AdminError("Недостатньо прав", 403);
      // Resolve profile inside the transaction, not from a stale browser/JWT.
      const profileId = currentActor.permissionProfileId;
      const actorProfile = profileId
        ? await PermissionProfile.findById(profileId).session(session).lean()
        : null;
      const access = profileId
        ? {
            permissionProfileId: profileId,
            permissions: actorProfile?.permissions ?? [],
            isSuperadmin:
              actorProfile?._id === SUPERADMIN_PROFILE_ID &&
              actorProfile.isSystem,
          }
        : await getUserAccess(currentActor);
      if (!can(access as PermissionAccess, "admin.access"))
        throw new AdminError("Недостатньо прав", 403);
      if (
        changes.isActive !== undefined &&
        !can(access as PermissionAccess, "users.status.update")
      )
        throw new AdminError("Недостатньо прав", 403);
      if (changes.permissionProfileId !== undefined && !access.isSuperadmin)
        throw new AdminError("Призначати профілі може лише суперадмін", 403);

      const target: UserDocument | null =
        await User.findById(id).session(session);
      if (!target) throw new AdminError("Користувача не знайдено", 404);
      if (
        target.permissionProfileId === SUPERADMIN_PROFILE_ID &&
        !access.isSuperadmin
      )
        throw new AdminError("Змінювати суперадміна може лише суперадмін", 403);
      if (
        changes.permissionProfileId &&
        !(await PermissionProfile.exists({
          _id: changes.permissionProfileId,
        }).session(session))
      ) {
        throw new AdminError("Профіль не знайдено", 404);
      }
      const active = changes.isActive ?? target.isActive;
      const nextProfile =
        changes.permissionProfileId ?? target.permissionProfileId;
      if (
        target.isActive &&
        target.permissionProfileId === SUPERADMIN_PROFILE_ID &&
        (!active || nextProfile !== SUPERADMIN_PROFILE_ID)
      ) {
        const count = await User.countDocuments({
          isActive: true,
          permissionProfileId: SUPERADMIN_PROFILE_ID,
        }).session(session);
        if (count <= 1)
          throw new AdminError(
            "Не можна позбавити доступу останнього активного суперадміна",
            409,
          );
      }
      const before = {
        isActive: target.isActive,
        permissionProfileId: target.permissionProfileId ?? null,
      };
      await User.updateOne({ _id: id }, { $set: changes }, { session });
      await AdminAudit.create(
        [
          {
            actorId: actor.id,
            action: "admin.user.updated",
            targetId: id,
            before,
            after: { ...before, ...changes },
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}

export async function saveAdminProfile(
  actor: Actor,
  input: unknown,
  id?: string,
) {
  const changes = profileInputSchema.parse(input);
  if (id === SUPERADMIN_PROFILE_ID)
    throw new AdminError("Кореневий профіль не можна редагувати", 403);
  const db = await connectDB();
  const session = await db.startSession();
  try {
    return await session.withTransaction(async () => {
      const root = await PermissionProfile.findOneAndUpdate(
        { _id: SUPERADMIN_PROFILE_ID, isSystem: true },
        { $inc: { revision: 1 } },
        { session },
      );
      if (!root)
        throw new AdminError(
          "Спочатку виконайте міграцію профілів доступу",
          409,
        );
      const current = await User.exists({
        _id: actor.id,
        isActive: true,
        permissionProfileId: SUPERADMIN_PROFILE_ID,
      }).session(session);
      if (!current) throw new AdminError("Дія доступна лише суперадміну", 403);
      const before = id
        ? await PermissionProfile.findById(id).session(session).lean()
        : null;
      if (id && !before) throw new AdminError("Профіль не знайдено", 404);
      const profile = id
        ? await PermissionProfile.findByIdAndUpdate(
            id,
            { $set: changes, $inc: { revision: 1 } },
            { new: true, runValidators: true, session },
          )
        : (await PermissionProfile.create([changes], { session }))[0];
      if (!profile) throw new AdminError("Профіль не знайдено", 404);
      await AdminAudit.create(
        [
          {
            actorId: actor.id,
            action: id ? "admin.profile.updated" : "admin.profile.created",
            targetId: profile._id,
            before,
            after: changes,
          },
        ],
        { session },
      );
      return profile._id;
    });
  } finally {
    await session.endSession();
  }
}
