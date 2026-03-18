import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { SkillTemplate } from "./registry.js";

const connectionSchema = z.object({
  provider: z.string(),
  env: z.record(z.string(), z.string()),
  reason: z.string(),
  optional: z.boolean().optional(),
  multi: z.boolean().optional(),
  requestedScopes: z.array(z.string()).optional(),
});

const metadataSchema = z.object({
  version: z.string(),
  author: z.string().optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  tags: z.array(z.string()).optional(),
  connections: z.array(connectionSchema).optional(),
});

const skillFrontmatterSchema = z.object({
  name: z.string(),
  description: z.string(),
  metadata: metadataSchema,
});

export { skillFrontmatterSchema };

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
    const raw = parseYaml(frontmatterRaw);
    const fm = skillFrontmatterSchema.parse(raw);

    return {
      id,
      name: fm.name,
      description: fm.description,
      version: fm.metadata.version,
      author: fm.metadata.author,
      category: fm.metadata.category,
      icon: fm.metadata.icon,
      tags: fm.metadata.tags,
      connections: fm.metadata.connections,
      instructions: body.trim() || undefined,
    };
  } catch {
    return null;
  }
}
