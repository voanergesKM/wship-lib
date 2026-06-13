const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;

type Note = typeof NOTES[number];
type FlatNote = typeof FLAT_NOTES[number];

function normalizeNote(note: string): Note {
  const flatToSharp: Record<string, Note> = {
    "Db": "C#",
    "Eb": "D#",
    "Gb": "F#",
    "Ab": "G#",
    "Bb": "A#",
  };

  return flatToSharp[note] || (note as Note);
}

function transposeNote(note: string, semitones: number): string {
  const normalized = normalizeNote(note);
  const index = NOTES.indexOf(normalized);

  if (index === -1) {
    return note;
  }

  const newIndex = (index + semitones) % 12;
  const adjustedIndex = newIndex < 0 ? newIndex + 12 : newIndex;

  return NOTES[adjustedIndex];
}

function parseChord(chord: string): { root: string; suffix: string } {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) {
    return { root: chord, suffix: "" };
  }

  return { root: match[1], suffix: match[2] };
}

function transposeSingleChord(chordPart: string, semitones: number): string {
  const { root, suffix } = parseChord(chordPart);
  const transposedRoot = transposeNote(root, semitones);

  return transposedRoot + suffix;
}

export function transposeChord(chord: string, semitones: number): string {
  if (!chord) {
    return chord;
  }

  if (chord.includes("/")) {
    const [mainChord, bassNote] = chord.split("/");
    
    const transposedMain = transposeSingleChord(mainChord, semitones);
    const transposedBass = transposeSingleChord(bassNote, semitones);
    
    return `${transposedMain}/${transposedBass}`;
  }

  return transposeSingleChord(chord, semitones);
}

export function transposeContent(content: string, semitones: number): string {
  return content.replace(/\[(.*?)\]/g, (match, chord) => {
    const transposed = transposeChord(chord, semitones);
    return `[${transposed}]`;
  });
}
