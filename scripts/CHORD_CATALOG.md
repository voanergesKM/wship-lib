# Chord catalog: migration and maintenance

The database is the only runtime source. `chord-catalog.seed.json` is an immutable migration/test fixture, not a fallback catalog. The resolver and SVG renderer remain pure code. The import contains 27 types and 69 source templates (duplicate positions are merged).

## Deployment

1. Use Node.js 22+ (the migration uses `process.loadEnvFile`). Run `npm run test:chords`, `npx tsc --noEmit`, and lint.
2. Run `npm run migrate:chords` to validate all seed definitions and positions without connecting to a database.
3. Back up the target MongoDB database using your normal deployment process. Set `MONGODB_URI` for the intended environment (`.env.local` is supported; never commit credentials).
4. Before deploying the new reader, run `npm run migrate:chords -- --apply`. It creates unique indexes and imports records transactionally. MongoDB must support transactions (replica set, including Atlas, or sharded cluster). No standalone-server fallback silently weakens atomicity.
5. Open `/chords` and a song chord popover. Submit an add/edit/new-type proposal as a regular user. Review it as admin. Refresh the catalog to verify the approved change. Confirm unauthenticated writes and non-admin reviews are rejected.

The command is idempotent by stable seed IDs. Existing records are never overwritten, including moderator-approved edits. Index failures or duplicate symbols stop the import. A failed transaction rolls back imported data; indexes may already exist. An empty database yields an empty catalog with an explicit message; an unavailable database yields an error with retry.

## Stored data and uniqueness

- `chorddefinitions`: canonical quality (no root/bass), aliases, Ukrainian name, category (`basic`, `jazz`, `suspended`), pitch-class intervals 0–11 and allowed omissions (only 0 and/or 7). Unique multikey `symbols` index claims the normalized canonical symbol and all aliases. Symbols cannot start with a note letter A–G or end in a slash bass; these belong to the voicing fields. Case is preserved (`M` differs from `m`); unicode accidentals normalize to ASCII. A unique sorted interval signature prevents an equivalent type being entered under a new name.
- `chordvoicings`: root and optional absolute bass pitch class, six frets and fingers ordered low E to high e, barres, movable/extra-octave flags, explicitly omitted intervals, version. Identity = type + root + bass + six fret values. Different fingering for the same position is an edit, not a duplicate position.
- `chordproposals`: immutable requested payload, original voicing snapshot/version, definition snapshot, author, status and review information. Authors can cancel pending submissions; to change a submission they cancel and submit anew. Only admins approve/reject. Admin POST submissions apply immediately and are recorded as approved with reviewer/time and a direct-change review comment. Regular users still create pending proposals. No notification is sent automatically.

Approvals and direct admin saves use the same write helper and apply the voicing/type and history record in one transaction. The server derives direct-save permission from the authenticated role, never request fields. Both require an explanatory comment, enforce uniqueness and reject stale versions. The editor refreshes the catalog after a direct save. Version checks prevent stale edits, and unique indexes resolve simultaneous duplicate approvals. Proposal bodies are parsed by shared Zod schemas on submission and approval. Numeric pitches, actual lowest MIDI note, all declared notes/omissions, string order, fingering and barres are validated. Musical validation does not guarantee comfortable hand placement; the moderator checks playability.

## Rendering and editing

The whole approved catalog is fetched through `/api/chords`, shared by React Query for one minute. Changes invalidate the cache for the reviewer; other browsers refresh on their next stale query/refocus. Data is not read from the seed on the server or in the browser.

The editor opens the original template, even if launched from a transposed variant. Movable templates shift every sounding fret, including open strings; muted strings remain muted. Extra octave variants are limited to fret 17, others to 24. Pressed notes must span at most five frets. Finger numbers are shown only at the authored position; existing barres move with the shape. New fingerings/barres are never invented for shifted open strings. `6/9` belongs to a quality; a trailing slash followed by a note is the bass.

Note validation reports extra/missing pitch classes and an incorrect lowest bass. The editor and submission API suggest up to three exact catalog matches for the selected root, explicit bass and declared omissions; they do not guess another root or change the selected type. For example, A with frets `5 7 7 6 0 0` reports extra B and suggests Aadd9 if that type exists in the approved catalog. Pitch classes are calculated from standard-tuning MIDI notes plus frets, modulo 12. Validation rules remain strict; suggestions do not authorize mismatched notes. No migration is needed for these diagnostics.

Update `app/chords/_components/ChordFormatGuideDialog.tsx` AND this file whenever structures, validation, editor fields, naming, transposition or moderation behavior change. This requirement also lives in `AGENTS.md`.

## Isolated integration verification

`tests/chordApi.integration.mjs` exercises public reads, auth/roles/ownership, add/edit/new-type proposals, cancellation/rejection, stale edits, concurrent duplicate approvals with rollback, and idempotent import. It requires a **fresh disposable** replica-set database named `wship_chords_integration` on `127.0.0.1`, plus a separate Next server using that same database. It creates only test users and catalog changes in that database. It deliberately refuses non-local target URIs.

1. Start a disposable `mongo:7` replica set with a loopback-only mapped port and initiate it with `rs.initiate`.
2. Run the seed with `MONGODB_URI` pointing to the disposable database and `--apply`.
3. Start an isolated Next dev server with that `MONGODB_URI` and a test-only `JWT_SECRET`. Use a temporary copy of the app if a dev server is already running; do not stop the user's server or point these tests at it.
4. Run `node tests/chordApi.integration.mjs` with `CHORD_TEST_MONGODB_URI`, `CHORD_TEST_BASE_URL=http://localhost:<port>`, and `CHORD_TEST_JWT_SECRET` matching the isolated server.
5. Stop the isolated server and remove the disposable container. Do not reuse this database for subsequent runs: the test intentionally leaves approved catalog changes for assertions.

Browser smoke checks: open `/chords` as a test user, edit an Amaj7 form to `5 7 6 6 5 5`, set fingers `1 4 2 3 1 1` and barre `5 6 1 1`; verify live dots/numbers/barre. Change a note and confirm submission is blocked; open/close the nested guide; test a 390px viewport; submit a valid proposal; verify a duplicate new type is blocked. Use only the isolated server for submission checks.

## Audio preview

The viewer and editor synthesize the selected voicing on demand using Web Audio, without samples or database changes. Frequencies use standard-tuning MIDI pitches plus fret and capo offset (A4 = 440 Hz); muted strings are skipped and open strings retained. The song viewer passes its capo offset; editor templates use no capo. A short low-to-high strum uses harmonic oscillators with decaying volume/brightness, an approximate plucked timbre rather than a recorded guitar. Only one preview plays at a time. Stop, shape/capo changes and unmount release playback nodes; AudioContext is created only on a button click and shared. Playback failures are shown inline.

## Capo suggestions

The key/capo settings popover contains the “Зручні акорди” action and the undo action. SongText offers up to three strictly lower-scoring alternatives over capo frets 0–12, using all distinct parsed lyric chords (including nested sections). Displayed shapes transpose by current user transposition minus candidate capo, so applying a result changes only capo and preserves the selected sounding key. Metadata key is informational, not the source of chord extraction. Undo restores the prior capo and transposition. The catalog supplies complete voicings; candidates with omitted tones are excluded. Unknown/unavailable current chords block ranking with an explicit explanation. The heuristic considers fretted strings, span, position, open strings, authored or likely barres, muted-string targeting, and a high-capo penalty; it does not model transitions or individual technique. Suggested shapes and capo-aware audio are shown in the dialog. No persistence or migration changes.
