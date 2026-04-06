export interface SpeechPayload {
  /** Sentence text to synthesize */
  text: string;
  /** TTS voice identifier */
  voice: string | undefined;
  /** Connection ID for resolving the speech model (e.g. "openai:tts-1") */
  connectionId: string;
}

/**
 * Build a URL for on-demand TTS synthesis of a single sentence.
 * The text is base64url-encoded to avoid query-string escaping issues.
 */
export function buildSpeechUrl(
  baseUrl: string,
  payload: SpeechPayload,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const encodedText = Buffer.from(payload.text).toString("base64url");
  const params = new URLSearchParams({
    text: encodedText,
    connectionId: payload.connectionId,
  });
  if (payload.voice) {
    params.set("voice", payload.voice);
  }
  return `${base}/api/speech/sentence?${params.toString()}`;
}
