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

export function extractSongSections(content: string): string[] {
  const regex = /<section\s+(?:id|name)=["']?([^"'>]+)["']?\s*>/gi;
  const sections: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const id = match[1]?.trim();
    if (id && !sections.includes(id)) {
      sections.push(id);
    }
  }

  return sections;
}

/**
 * ⚠️ УВАГА / IMPORTANT:
 * Цей парсер визначає синтаксис розмітки пісень:
 * - акорди [Chord]
 * - теги секцій <section id="...">...</section>
 * - заголовки #, ##, ###
 * - теги вирівнювання @center, @left, @right
 *
 * При будь-якій зміні, додаванні нових тегів чи модифікації правил парсингу:
 * ОБОВ'ЯЗКОВО оновіть інструкцію та приклади для користувачів у компоненті:
 * @see "@/songs/_components/SongFormatGuideDialog"
 */
export function parseSong(content: string): Block[] {
  const lines = content.split("\n");

  const blocks: Block[] = [];

  let align: "left" | "center" | "right" = "left";
  let currentSectionId: string | null = null;
  let currentSectionBlocks: Block[] = [];

  const flushCurrentSection = () => {
    if (currentSectionId) {
      blocks.push({
        type: "section",
        id: currentSectionId,
        blocks: currentSectionBlocks,
      });
      currentSectionId = null;
      currentSectionBlocks = [];
    }
  };

  const addBlock = (block: Block) => {
    if (currentSectionId) {
      currentSectionBlocks.push(block);
    } else {
      blocks.push(block);
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Check for <section id="..."> tag
    const sectionOpenMatch = line.match(
      /^<section\s+(?:id|name)=["']?([^"'>]+)["']?\s*>/i,
    );
    if (sectionOpenMatch) {
      flushCurrentSection();
      currentSectionId = sectionOpenMatch[1]?.trim() || "Секція";
      continue;
    }

    // Check for </section> tag
    if (/^<\/section>/i.test(line)) {
      flushCurrentSection();
      continue;
    }

    if (!line) {
      addBlock({
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
      addBlock({
        type: "heading",
        level: 1,
        text: line.slice(2),
        align,
      });

      continue;
    }

    if (line.startsWith("## ")) {
      addBlock({
        type: "heading",
        level: 2,
        text: line.slice(3),
        align,
      });

      continue;
    }

    if (line.startsWith("### ")) {
      addBlock({
        type: "heading",
        level: 3,
        text: line.slice(4),
        align,
      });

      continue;
    }

    addBlock({
      type: "lyrics",
      parts: parseLine(line),
      align,
    });
  }

  flushCurrentSection();

  return blocks;
}
