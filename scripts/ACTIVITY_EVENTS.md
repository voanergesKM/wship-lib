# Activity recording

## Deployment

Run `npm run migrate:activity` for validation only (no DB connection). Run `npm run migrate:activity -- --apply` against the intended `MONGODB_URI` to create indexes and idempotently import existing `adminaudits` into the activity journal. The original administrative history is preserved. Do this before deploying activity writes in production, especially when Mongoose `autoIndex` is disabled. No account/profile is assigned by this migration. The root profile automatically has the new `activity.read` permission; other profiles must be explicitly granted it together with `admin.access`.

## Event contract

`app/lib/activity/catalog.ts` defines the allowed action keys, Ukrainian labels, categories, target kinds and **strict per-action payload schemas**. Authorization permissions remain a separate catalog. Activity records contain a server timestamp, actor ID (or null for existing anonymous song creation), target ID/optional name snapshot, optional group context, source and idempotency key. No request bodies, song text, invitee email/username, review comments, session tokens, Telegram initData or IP addresses are collected.

Instrumented web actions: successful login/logout; song create/update/delete; arrangement create/update/delete; song proposal create/update/cancel/approve/reject; group create/delete, joining/removing members and invitation send/cancel/reject; playlist create/update/delete, adding/removing songs and selecting arrangements; chord submission/direct changes/review/cancellation; administrative user/profile changes. Public catalog/page reads and metadata/prefetch requests do not count as views. Telegram bot content creation and other actions outside these web handlers are not yet instrumented.

Ordinary activity writes are awaited and best-effort: a journal failure must not turn an already committed business operation into an HTTP failure. They are not a complete transactional audit; a crash between the operation and recording can leave a gap. Existing administrative audit writes and their activity entries share the access-change transaction. Chord transactional changes and their activity entries also commit together; journal failures roll back these transactions.

## Song views

`useSongViewActivity` sends `song.view` only after a loaded song is displayed in a visible document for an authenticated account. Hidden tabs wait until visible. React Strict Mode remount effects reuse the event ID; navigation to a different song/context creates a new ID. Network errors never block the viewer and views are not retried automatically. Client views are observations reported by a browser, not proof of an operation, complete analytics or exact presence.

`POST /api/activity` accepts **only** the strict song-view shape. The server derives the actor from the active session and its own current timestamp, loads the canonical song title/ID, checks group membership and checks song membership in the supplied playlist. Clients cannot submit server/admin actions, actor IDs or timestamps. Keys are namespaced by actor. A unique event index makes retries idempotent; a DB-backed per-user/minute counter limits new requests to 30 even across server instances. Counter documents expire automatically. Duplicate event retries do not update last-seen time.

Only `song.view` records get `expiresAt` (90 days after recording). MongoDB TTL cleanup is asynchronous. Other activity and the original administrative audit have no automatic expiry in this version. Unique/index definitions are shared by the model and migration. No historic views or login times are reconstructed.

`lastSeenAt` advances via `$max` following an inserted event, with updates throttled to one minute. It describes the last successfully recorded activity and can lag or miss events. Existing login handlers still set login/seen dates. `/api/auth/me` checks and server prefetches do not refresh it.

## Admin UI and verification

`/admin/activity` is server-rendered under `admin.access` plus `activity.read`, with stable pagination, filters by username/ID, group name/ID, action, source and inclusive Kyiv calendar dates (including DST). User/group cards link to scoped activity. Further user/group navigation links are shown only with their respective read permissions. Deleted targets keep stored IDs/optional names, not live document snapshots. The journal intentionally distinguishes browser-reported events from server actions.

Run `npm run test:activity`, `npm run test:permissions`, `npm run test:groups`, and `npm run test:chords`. Isolated tests use dependency mocks and do not prove real MongoDB unique-index/transaction semantics. On a disposable replica set, also verify concurrent duplicate view submissions, minute quotas, rollback after failed journal writes, forbidden group contexts, TTL index settings, and access revocation. Verify visible/hidden tab behavior and navigation in a browser before production.
