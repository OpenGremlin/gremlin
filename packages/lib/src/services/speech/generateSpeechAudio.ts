import type { SpeechModel } from "ai";
import { experimental_generateSpeech as generateSpeech } from "ai";

/**
 * Generate speech audio from text using the given speech model.
 * Returns raw audio bytes (mp3 by default from OpenAI).
 */
export async function generateSpeechAudio(
  speechModel: SpeechModel,
  text: string,
  voice?: string,
): Promise<Uint8Array | null> {
  const result = await generateSpeech({
    model: speechModel,
    text,
    ...(voice ? { voice } : {}),
  });

  return result.audio?.uint8Array ?? null;
}
