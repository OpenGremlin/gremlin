import { createHash, randomBytes } from "node:crypto";

const KEY_PREFIX = "grm_whk_";
/** Length of plaintext shown in the UI (e.g. "grm_whk_aB3xK9…"). */
const DISPLAY_PREFIX_LEN = 16;

export interface NewKey {
  /** Plaintext, returned to the caller exactly once. */
  plaintext: string;
  /** Hex-encoded sha256 of the plaintext. Stored as the row id/lookup key. */
  hash: string;
  /** Truncated plaintext for UI display ("grm_whk_aB3xK9…"). */
  prefix: string;
}

export function generateKey(): NewKey {
  const random = randomBytes(32).toString("base64url");
  const plaintext = `${KEY_PREFIX}${random}`;
  return {
    plaintext,
    hash: hashKey(plaintext),
    prefix: plaintext.slice(0, DISPLAY_PREFIX_LEN),
  };
}

export function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}
