import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { createLogger } from "../../logger.js";
import { parseSkillFile } from "./parseSkillFile.js";
import type { SkillTemplate } from "./registry.js";

const log = createLogger("skills:scanner");

const s3 = new S3Client({});

let cachedCatalog: SkillTemplate[] | null = null;
let cacheExpiry = 0;

const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Scan S3 for SKILL.md files and return parsed skill templates.
 * Results are cached in memory with a 1-minute TTL.
 */
export async function scanSkillCatalog(
  bucketName: string,
): Promise<SkillTemplate[]> {
  const now = Date.now();
  if (cachedCatalog && now < cacheExpiry) {
    return cachedCatalog;
  }

  const templates: SkillTemplate[] = [];

  for (const prefix of ["core/"]) {
    const dirs = await listSkillDirectories(bucketName, prefix);

    for (const dir of dirs) {
      try {
        const content = await getSkillFile(bucketName, `${dir}SKILL.md`);
        if (!content) continue;

        // Derive ID from directory name: "core/github/" → "github"
        const id = dir.replace(prefix, "").replace(/\/$/, "");
        const template = parseSkillFile(id, content);
        if (template) {
          templates.push(template);
        } else {
          log.warn({ dir }, "Failed to parse SKILL.md");
        }
      } catch (err) {
        log.warn({ err, dir }, "Error reading SKILL.md");
      }
    }
  }

  cachedCatalog = templates;
  cacheExpiry = now + CACHE_TTL_MS;

  return templates;
}

/** Look up a single skill template by ID */
export async function getSkillTemplateFromS3(
  bucketName: string,
  skillId: string,
): Promise<SkillTemplate | null> {
  // Try core/ prefix first
  for (const prefix of ["core/"]) {
    const key = `${prefix}${skillId}/SKILL.md`;
    try {
      const content = await getSkillFile(bucketName, key);
      if (content) {
        return parseSkillFile(skillId, content);
      }
    } catch {
      // Not found in this prefix
    }
  }
  return null;
}

/** Invalidate the in-memory cache */
export function invalidateSkillCache(): void {
  cachedCatalog = null;
  cacheExpiry = 0;
}

async function listSkillDirectories(
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: "/",
    }),
  );

  return (result.CommonPrefixes ?? [])
    .map((p) => p.Prefix)
    .filter((p): p is string => !!p);
}

async function getSkillFile(
  bucket: string,
  key: string,
): Promise<string | null> {
  try {
    const result = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    return (await result.Body?.transformToString("utf-8")) ?? null;
  } catch {
    return null;
  }
}
