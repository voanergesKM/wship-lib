# AI Agent Instructions

Always:

- preserve project architecture
- avoid unnecessary refactors
- prefer reusable abstractions
- keep components small
- use TypeScript strictly
- never break existing API contracts
- when modifying the song parser (`app/utils/parseSong.ts`), always update user instructions in `app/songs/_components/SongFormatGuideDialog.tsx`

- when modifying chord/voicing structures, validation, parsing, transposition, editor fields, or proposal workflows (`app/types/chords.ts`, `app/lib/chords/`, `app/utils/guitarChords.ts`, `app/utils/chordTransposition.ts`, `app/models/ChordCatalog.ts`, `app/api/chords/`, `app/chords/_components/`), always update the user guide `app/chords/_components/ChordFormatGuideDialog.tsx` and migration/deployment documentation in `scripts/CHORD_CATALOG.md` to match the resulting behavior

When editing:

- explain why
- keep styling consistent
- preserve responsiveness
