/**
 * Returns the S3 bucket name for skill files.
 * Falls back to a default if not set (for local dev).
 */
export function getSkillsBucket(): string {
  return process.env.SKILLS_BUCKET ?? "gremlin-skills";
}
