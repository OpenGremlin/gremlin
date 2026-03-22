import type { SkillTemplate } from "../registry.js";
import {
  getLocalReference,
  getLocalTemplate,
  listLocalReferences,
  scanLocalCatalog,
} from "./localReader.js";
import {
  getS3Reference,
  getS3Template,
  listS3References,
  scanS3Catalog,
} from "./s3Reader.js";

export type { SkillTemplate } from "../registry.js";

let cachedCatalog: SkillTemplate[] | null = null;
let cacheExpiry = 0;

const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Scan for SKILL.md files and return parsed skill templates.
 * Uses S3 when bucketName is provided, local filesystem otherwise.
 * Results are cached in memory with a 1-minute TTL.
 */
export async function scanSkillCatalog(
  bucketName: string | null,
): Promise<SkillTemplate[]> {
  const now = Date.now();
  if (cachedCatalog && now < cacheExpiry) {
    return cachedCatalog;
  }

  const templates = bucketName
    ? await scanS3Catalog(bucketName)
    : scanLocalCatalog();

  cachedCatalog = templates;
  cacheExpiry = now + CACHE_TTL_MS;

  return templates;
}

/** Look up a single skill template by ID */
export async function getSkillTemplateFromS3(
  bucketName: string | null,
  skillId: string,
) {
  if (!bucketName) return getLocalTemplate(skillId);
  return getS3Template(bucketName, skillId);
}

/**
 * Fetch a reference file for a skill.
 * Accepts a short name like "send" and resolves to "references/send.md".
 */
export async function getSkillReferenceFromS3(
  bucketName: string | null,
  skillId: string,
  name: string,
): Promise<string | null> {
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return null;
  }

  if (!bucketName) return getLocalReference(skillId, name);
  return getS3Reference(bucketName, skillId, name);
}

/**
 * List available reference file names for a skill.
 * Returns short names (e.g. ["send", "triage", "read"]).
 */
export async function listSkillReferencesFromS3(
  bucketName: string | null,
  skillId: string,
): Promise<string[]> {
  if (!bucketName) return listLocalReferences(skillId);
  return listS3References(bucketName, skillId);
}

/** Invalidate the in-memory cache */
export function invalidateSkillCache(): void {
  cachedCatalog = null;
  cacheExpiry = 0;
}
