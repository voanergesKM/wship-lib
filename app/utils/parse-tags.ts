export function parseTags(text: string) {
  const tags = text.match(/#\w+/g)?.map((t) => t.slice(1)) || [];
  const title = text.replace(/#\w+/g, "").trim();

  return { tags, title };
}
