import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createLogger } from "../../../logger.js";
import { parseSkillFile } from "../parseSkillFile.js";
import type { SkillTemplate } from "../registry.js";

const log = createLogger("skills:scanner:local");

/** Local skills directory: packages/lib/skills */
const SKILLS_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../skills",
);

export function scanLocalCatalog(): SkillTemplate[] {
  const templates: SkillTemplate[] = [];
  try {
    const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true });
    for (const entry of dirs) {
      if (!entry.isDirectory()) continue;
      const content = readFile(join(SKILLS_DIR, entry.name, "SKILL.md"));
      if (!content) continue;

      const template = parseSkillFile(entry.name, content);
      if (template) {
        templates.push(template);
      } else {
        log.warn({ dir: entry.name }, "Failed to parse SKILL.md");
      }
    }
  } catch (err) {
    log.warn({ err }, "Error scanning local skills directory");
  }
  return templates;
}

export function getLocalTemplate(skillId: string): SkillTemplate | null {
  const content = readFile(join(SKILLS_DIR, skillId, "SKILL.md"));
  if (!content) return null;
  return parseSkillFile(skillId, content);
}

export function getLocalReference(
  skillId: string,
  name: string,
): string | null {
  return readFile(join(SKILLS_DIR, skillId, "references", `${name}.md`));
}

export function listLocalReferences(skillId: string): string[] {
  const refsDir = join(SKILLS_DIR, skillId, "references");
  try {
    return readdirSync(refsDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));
  } catch {
    return [];
  }
}

function readFile(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}
