/**
 * Returns the S3 bucket name for skill files, or null to use local filesystem.
 * Throws in production if not set.
 */
export function getSkillsBucket(): string | null {
  const bucket = process.env.SKILLS_BUCKET || null;
  if (!bucket && process.env.NODE_ENV === "production") {
    throw new Error("SKILLS_BUCKET must be set in production");
  }
  return bucket;
}
