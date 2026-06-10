import { Block, Part } from "@/types/parse-song.types";

function parseLine(line: string): Part[] {
  const regex = /\[(.*?)\]/g;

  const parts: Part[] = [];

  let lastIndex = 0;
  let currentChord: string | undefined;

  let match;

  while ((match = regex.exec(line)) !== null) {
    const lyric = line.slice(lastIndex, match.index);

    if (lyric || currentChord) {
      parts.push({
        chord: currentChord,
        lyric,
      });
    }

    currentChord = match[1];

    lastIndex = regex.lastIndex;
  }

  parts.push({
    chord: currentChord,
    lyric: line.slice(lastIndex),
  });

  return parts;
}

export function parseSong(content: string): Block[] {
  const lines = content.split("\n");

  const blocks: Block[] = [];

  let align: "left" | "center" | "right" = "left";

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      blocks.push({
        type: "empty",
        align: "left",
      });
      continue;
    }

    if (line === "@center") {
      align = "center";
      continue;
    }

    if (line === "@left") {
      align = "left";
      continue;
    }

    if (line === "@right") {
      align = "right";
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({
        type: "heading",
        level: 1,
        text: line.slice(2),
        align,
      });

      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({
        type: "heading",
        level: 2,
        text: line.slice(3),
        align,
      });

      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({
        type: "heading",
        level: 3,
        text: line.slice(4),
        align,
      });

      continue;
    }

    blocks.push({
      type: "lyrics",
      parts: parseLine(line),
      align,
    });
  }

  return blocks;
}
