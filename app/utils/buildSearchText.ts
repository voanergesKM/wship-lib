import { parseSong } from "@/utils/parseSong";
import { Block } from "@/types/parse-song.types";

export function buildSearchText(song: {
  title?: string;
  tags?: string[];
  authors?: string[];
  document?: string;
}) {
  return normalizeSearchText([
    song.title,
    ...(song.tags || []),
    ...(song.authors || []),
    getDocumentSearchText(song.document),
  ]);
}

function extractBlockText(block: Block): string {
  if (block.type === "heading") {
    return block.text;
  }

  if (block.type === "lyrics") {
    return block.parts.map((part) => part.lyric).join("");
  }

  if (block.type === "section") {
    return `${block.id} ${block.blocks.map(extractBlockText).join(" ")}`;
  }

  return "";
}

function getDocumentSearchText(document?: string) {
  if (!document) {
    return "";
  }

  return parseSong(document)
    .map(extractBlockText)
    .join(" ");
}

function normalizeSearchText(values: Array<string | undefined>) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}
