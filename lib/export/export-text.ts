export function composeLlmText(prompt: string, markdown: string): string {
  const trimmed = prompt.trim();
  return trimmed ? `${trimmed}\n\n${markdown}` : markdown;
}

export function markdownFileName(title: string): string {
  const base = title
    .replace(/[\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${base || "page"}.md`;
}
