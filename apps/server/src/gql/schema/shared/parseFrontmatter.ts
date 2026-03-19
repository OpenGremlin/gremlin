export function parseFrontmatter(content: string): {
  title: string;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { title: "", body: content };
  const frontmatter = match[1];
  const body = match[2];
  const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
  return { title: titleMatch?.[1]?.trim() ?? "", body };
}
