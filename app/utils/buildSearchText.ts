export function buildSearchText(song: {
  title?: string;
  tags?: string[];
  authors?: string[];
  document?: string;
}) {
  return [
    song.title,
    ...(song.tags || []),
    ...(song.authors || []),
    song.document,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
