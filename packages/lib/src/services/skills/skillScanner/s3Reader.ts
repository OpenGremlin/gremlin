import { GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createLogger } from "../../../logger.js";
import { parseSkillFile } from "../parseSkillFile.js";
import type { SkillTemplate } from "../registry.js";
import { getS3Client } from "../s3Client.js";

const log = createLogger("skills:scanner:s3");

export async function scanS3Catalog(
  bucketName: string,
): Promise<SkillTemplate[]> {
  const templates: SkillTemplate[] = [];

  for (const prefix of ["core/"]) {
    const dirs = await listDirectories(bucketName, prefix);

    for (const dir of dirs) {
      try {
        const content = await getFile(bucketName, `${dir}SKILL.md`);
        if (!content) continue;

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

  return templates;
}

export async function getS3Template(
  bucketName: string,
  skillId: string,
): Promise<SkillTemplate | null> {
  for (const prefix of ["core/"]) {
    const key = `${prefix}${skillId}/SKILL.md`;
    try {
      const content = await getFile(bucketName, key);
      if (content) {
        return parseSkillFile(skillId, content);
      }
    } catch {
      // Not found in this prefix
    }
  }
  return null;
}

export async function getS3Reference(
  bucketName: string,
  skillId: string,
  name: string,
): Promise<string | null> {
  const key = `core/${skillId}/references/${name}.md`;
  return getFile(bucketName, key);
}

export async function listS3References(
  bucketName: string,
  skillId: string,
): Promise<string[]> {
  const prefix = `core/${skillId}/references/`;
  try {
    const result = await (await getS3Client()).send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
      }),
    );

    return (result.Contents ?? [])
      .map((obj) => obj.Key)
      .filter((key): key is string => !!key)
      .filter((key) => key.endsWith(".md"))
      .map((key) => key.replace(prefix, "").replace(/\.md$/, ""));
  } catch {
    return [];
  }
}

async function listDirectories(
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const result = await (await getS3Client()).send(
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

async function getFile(bucket: string, key: string): Promise<string | null> {
  try {
    const result = await (await getS3Client()).send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    return (await result.Body?.transformToString("utf-8")) ?? null;
  } catch {
    return null;
  }
}
