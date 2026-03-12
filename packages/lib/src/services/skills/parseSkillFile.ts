import { parse as parseYaml } from "yaml";
import type { SkillTemplate } from "./registry.js";

/**
 * Parse a SKILL.md file into a SkillTemplate.
 * Extracts YAML frontmatter and Markdown body.
 */
export function parseSkillFile(
  id: string,
  content: string,
): SkillTemplate | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;

  const [, frontmatterRaw, body] = match;

  try {
    const fm = parseYaml(frontmatterRaw) as Record<string, unknown>;

    if (!fm.name || !fm.description || !fm.version) return null;

    return {
      id,
      name: fm.name as string,
      description: fm.description as string,
      version: fm.version as string,
      author: fm.author as string | undefined,
      category: fm.category as string | undefined,
      icon: fm.icon as string | undefined,
      tags: fm.tags as string[] | undefined,
      connections: fm.connections as SkillTemplate["connections"],
      install: fm.install as string | undefined,
      instructions: body.trim() || undefined,
    };
  } catch {
    return null;
  }
}
