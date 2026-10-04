import { Part } from "@/types/parse-song.types";

export type Syllable = {
  chord?: string;
  text: string;
};

export type WordToken = {
  syllables: Syllable[];
  trailingSpaces: string;
};

export function lineToWords(parts: Part[]): WordToken[] {
  const words: WordToken[] = [];
  let currentSyllables: Syllable[] = [];

  for (const part of parts) {
    const chord = part.chord;
    const lyric = part.lyric || "";

    if (!lyric) {
      if (chord) {
        currentSyllables.push({ chord, text: "" });
      }
      continue;
    }

    const tokens = lyric.split(/(\s+)/);
    let chordAssigned = !chord;

    for (const token of tokens) {
      if (!token) continue;

      if (/^\s+$/.test(token)) {
        if (!chordAssigned && chord) {
          currentSyllables.push({ chord, text: "" });
          chordAssigned = true;
        }

        if (currentSyllables.length > 0) {
          words.push({ syllables: currentSyllables, trailingSpaces: token });
          currentSyllables = [];
        } else if (words.length > 0) {
          words[words.length - 1].trailingSpaces += token;
        } else {
          words.push({
            syllables: [{ text: "" }],
            trailingSpaces: token,
          });
        }
      } else {
        const syllableChord = !chordAssigned ? chord : undefined;
        currentSyllables.push({ chord: syllableChord, text: token });
        chordAssigned = true;
      }
    }

    if (!chordAssigned && chord) {
      currentSyllables.push({ chord, text: "" });
    }
  }

  if (currentSyllables.length > 0) {
    words.push({ syllables: currentSyllables, trailingSpaces: "" });
  }

  return words;
}
