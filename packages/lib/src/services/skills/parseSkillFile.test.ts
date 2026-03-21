import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { parseSkillFile, skillFrontmatterSchema } from "./parseSkillFile.js";

const SKILLS_DIR = resolve(__dirname, "../../../skills");

/** Discover all SKILL.md files under packages/lib/skills/ */
function discoverSkillFiles(): { id: string; path: string }[] {
  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => ({
      id: e.name,
      path: resolve(SKILLS_DIR, e.name, "SKILL.md"),
    }))
    .filter(({ path }) => {
      try {
        readFileSync(path, "utf-8");
        return true;
      } catch {
        return false;
      }
    });
}

function extractFrontmatter(content: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  expect(match, "missing frontmatter delimiters").toBeTruthy();
  // biome-ignore lint/style/noNonNullAssertion: guarded by expect above
  return match![1];
}

const skills = discoverSkillFiles();

describe("SKILL.md validation", () => {
  it("discovers at least one skill", () => {
    expect(skills.length).toBeGreaterThan(0);
  });

  describe.each(skills)("$id", ({ id, path }) => {
    const content = readFileSync(path, "utf-8");

    it("has valid YAML frontmatter", () => {
      const fm = extractFrontmatter(content);
      expect(() => parseYaml(fm)).not.toThrow();
    });

    it("passes schema validation", () => {
      const fm = extractFrontmatter(content);
      const raw = parseYaml(fm);
      const result = skillFrontmatterSchema.safeParse(raw);
      if (!result.success) {
        const issues = result.error.issues
          .map((i) => `  ${i.path.join(".")}: ${i.message}`)
          .join("\n");
        throw new Error(`Schema validation failed for ${id}:\n${issues}`);
      }
    });

    it("parses into a valid SkillTemplate", () => {
      const template = parseSkillFile(id, content);
      expect(template, "parseSkillFile returned null").not.toBeNull();
      expect(template?.name).toBeTruthy();
      expect(template?.description).toBeTruthy();
      expect(template?.version).toBeTruthy();
    });

    it("has a non-empty instructions body", () => {
      const template = parseSkillFile(id, content);
      expect(template?.instructions).toBeTruthy();
    });

    it("has install instructions", () => {
      const template = parseSkillFile(id, content);
      expect(
        template?.install,
        `${id} is missing metadata.install`,
      ).toBeTruthy();
    });

    it("has at least one allowedCommands entry", () => {
      const template = parseSkillFile(id, content);
      expect(
        template?.allowedCommands?.length,
        `${id} is missing metadata.allowedCommands`,
      ).toBeGreaterThan(0);
    });
  });
});
