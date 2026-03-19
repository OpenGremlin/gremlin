import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 3600; // 1 hour

function getSecret(): string {
  return process.env.FILE_URL_SECRET ?? "dev-secret";
}

export function buildWorkspaceFileUrl(
  serverBase: string,
  filePath: string,
  options?: { width?: number | null; ttlSeconds?: number },
): string {
  const expires =
    Math.floor(Date.now() / 1000) +
    (options?.ttlSeconds ?? DEFAULT_TTL_SECONDS);
  const sig = createHmac("sha256", getSecret())
    .update(`${filePath}:${expires}`)
    .digest("hex");

  const base = serverBase.replace(/\/$/, "");
  const url = new URL(`/api/files/${encodeURIComponent(filePath)}`, base);
  url.searchParams.set("expires", String(expires));
  url.searchParams.set("sig", sig);
  if (options?.width) url.searchParams.set("width", String(options.width));
  return url.toString();
}

export function verifyFileSignature(
  filePath: string,
  expires: string,
  sig: string,
): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (Number(expires) < now) return false;

  const expected = createHmac("sha256", getSecret())
    .update(`${filePath}:${expires}`)
    .digest("hex");

  if (expected.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}
