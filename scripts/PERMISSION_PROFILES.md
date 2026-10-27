# Permission profiles and admin deployment

The permission catalog lives in `app/lib/permissions/catalog.ts`; profiles in `permissionprofiles`, and users reference one string `permissionProfileId`. Profile names are editable labels. Only the immutable system ID `superadmin` with `isSystem: true` grants all current/future permissions. Custom profiles grant only listed permissions. There are no per-user overrides or group-role inheritance.

## Bootstrap / deployment

1. Back up the database. Use a replica set (transactions are required, as for chord moderation).
2. Validate with `npm run migrate:permissions` (no DB connection/writes).
3. Identify your own existing active account's exact **numeric Telegram ID**. The logged-in `/api/auth/me` response exposes it as `user.telegramId`. Username is not an identifier. No account is automatically chosen or promoted by this change.
4. Run `npm run migrate:permissions -- --apply --superadmin-telegram-id <your-id>` against the intended database. It creates system profiles, assigns unassigned legacy users according to their existing role, and promotes only the explicitly selected account. It is transactional and preserves existing profile permissions on reruns. New users get the `user` profile. An existing legacy admin is moved to `legacy-admin`, preserving only its song/chord moderation rights. It does not automatically gain the new user/group administration permissions or superadmin access. The separate `admin` preset must be explicitly assigned by a superadmin.
5. Deploy, sign in again or refresh `/api/auth/me`, and open `/admin` from the account menu. Verify your root account, create a custom profile, and assign it to a test account.
6. Verify that a normal account cannot open admin pages or call admin APIs; try direct requests, not just hidden buttons. Test scoped admin access and last-superadmin rejection on a disposable replica set before production.

Do not delete the legacy `role` field yet: it remains in API responses for compatibility. Global authorization now uses effective permissions. Unassigned legacy `admin` documents temporarily retain their original privileged capabilities; explicit assignments always take priority. An explicitly assigned missing profile grants no elevated permissions. Group `owner/admin/member` roles keep their previous scope and behavior. `editor/viewer` had no global override in the existing guards and retain that behavior.

## Admin features

`/admin/users` supports search, status filtering, pagination, group memberships, profile and last login. User detail pages allow status changes according to `users.status.update`. `/admin/groups` and group details show all groups, memberships and playlist summaries under `groups.read`. Profile editing/creation and profile assignment are **superadmin-only**, even if the corresponding permission is listed on a custom profile. This is intentionally reserved for later scoped delegation. The root profile cannot be edited/deleted; profiles cannot be deleted through this interface.

The server rechecks permissions on every read/write. Administrative writes recheck the actor inside a transaction. Access changes lock the root profile document before counting active superadmins, so concurrent demotions/disabling cannot remove the last active root account. Ordinary admins cannot modify root accounts. The change and its administrative history entry commit together in `adminaudits`. No user session/token or password is copied to this history.

Both browser login endpoints reject inactive accounts before issuing cookies. `lastLoginAt` starts being recorded after deployment; it is not reconstructed from `updatedAt`. `lastSeenAt` currently records successful login only: page views, online presence, a public action catalog and a browsable activity timeline are a subsequent phase. Old dates are displayed as “Немає даних”.

## Validation

Run `npm run test:permissions` for permission resolution, input validation, authorization and transaction-guard tests. `npm run test:groups` covers the existing group reads/share metadata. These isolated tests do not replace deployment smoke checks with MongoDB transactions and real sessions.
