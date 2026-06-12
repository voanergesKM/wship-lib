import { extractYouTubeId } from "@/utils/extractYouTubeId";

export type YouTubeLink = {
  videoId: string;
  url: string;
};

type LegacyYouTubeLink = {
  videoId?: string | null;
  url?: string | null;
};

export function parseYouTubeLinks(value: string): YouTubeLink[] {
  return value
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => {
      const videoId = extractYouTubeId(url);

      return videoId ? { videoId, url } : null;
    })
    .filter((link): link is YouTubeLink => Boolean(link));
}

export function stringifyYouTubeLinks(value: unknown): string {
  return normalizeYouTubeLinks(value)
    .map((link) => link.url)
    .join("\n");
}

export function normalizeYouTubeLinks(value: unknown): YouTubeLink[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values
    .map((item) => normalizeYouTubeLink(item))
    .filter((link): link is YouTubeLink => Boolean(link));
}

function normalizeYouTubeLink(value: unknown): YouTubeLink | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const link = value as LegacyYouTubeLink;
  const url = typeof link.url === "string" ? link.url.trim() : "";
  const videoId =
    typeof link.videoId === "string" && link.videoId
      ? link.videoId
      : extractYouTubeId(url);

  if (!url || !videoId) {
    return null;
  }

  return { videoId, url };
}

export function hasOnlyValidYouTubeLinks(value: string) {
  return value
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean)
    .every((url) => extractYouTubeId(url) !== null);
}
