const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

export function parseWikilinks(body: string): string[] {
  const titles: string[] = [];
  for (const match of body.matchAll(WIKILINK_RE)) {
    const title = match[1].trim();
    if (title && !titles.includes(title)) titles.push(title);
  }
  return titles;
}
