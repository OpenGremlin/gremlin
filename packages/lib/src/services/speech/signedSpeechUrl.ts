import { createHmac, timingSafeEqual } from "node:crypto";

export interface SpeechPayload {
  /** Sentence text to synthesize */
  text: string;
  /** TTS voice identifier */
  voice: string | undefined;
  /** Connection ID for resolving the speech model (e.g. "openai:tts-1") */
  connectionId: string;
}

/**
 * Build a self-contained, HMAC-signed URL for on-demand TTS synthesis.
 *
 * The URL embeds the full payload (sentence text, voice, model config) so the
 * server needs no state to serve the request — it just verifies the signature,
 * decodes the payload, calls the TTS provider, and pipes audio back.
 */
export function buildSignedSpeechUrl(
  baseUrl: string,
  payload: SpeechPayload,
  secret: string,
): string {
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString("base64url");
  const sig = sign(encoded, secret);
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/api/speech/sentence?payload=${encoded}&sig=${sig}`;
}

/**
 * Verify the HMAC signature and decode the speech payload.
 * Returns null if the signature is invalid or the payload is malformed.
 */
export function verifyAndDecodeSpeechPayload(
  encodedPayload: string,
  sig: string,
  secret: string,
): SpeechPayload | null {
  const expected = sign(encodedPayload, secret);

  // Timing-safe comparison to prevent timing attacks
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const json = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    if (
      typeof parsed.text !== "string" ||
      typeof parsed.connectionId !== "string"
    ) {
      return null;
    }
    return parsed as SpeechPayload;
  } catch {
    return null;
  }
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}
