import { createLogger } from "@opengremlin/lib/logger.js";
import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import { getSpeechModelFromConfig } from "@opengremlin/lib/services/orchestrator/model.js";
import { generateSpeechAudio } from "@opengremlin/lib/services/speech/generateSpeechAudio.js";
import { verifyAndDecodeSpeechPayload } from "@opengremlin/lib/services/speech/signedSpeechUrl.js";
import type { Request, Response } from "express";

const log = createLogger("speech-sentence");

/**
 * GET /api/speech/sentence?payload=<base64url>&sig=<hmac>
 *
 * Stateless TTS endpoint. The payload is a signed, self-contained request
 * containing the sentence text, voice, and model connection ID. The server
 * verifies the HMAC, resolves the speech model, calls TTS, and streams
 * the audio back.
 */
export function createSpeechSentenceRoute(
  resources: Resources,
  services: Services,
  secret: string,
) {
  return async (req: Request, res: Response): Promise<void> => {
    const { payload, sig } = req.query;
    if (typeof payload !== "string" || typeof sig !== "string") {
      res.status(400).send("Missing payload or sig");
      return;
    }

    const decoded = verifyAndDecodeSpeechPayload(payload, sig, secret);
    if (!decoded) {
      res.status(403).send("Invalid signature");
      return;
    }

    const { text, voice, connectionId } = decoded;

    const ctx = { resources, services, log };
    const speechModel = await getSpeechModelFromConfig(
      ctx as Parameters<typeof getSpeechModelFromConfig>[0],
      { type: "connection", connectionId },
    );

    if (!speechModel) {
      res.status(500).send("No speech model configured");
      return;
    }

    try {
      const audio = await generateSpeechAudio(speechModel, text, voice);
      if (!audio) {
        res.status(500).send("No audio generated");
        return;
      }

      res
        .status(200)
        .set("Content-Type", "audio/mpeg")
        .set("Content-Length", String(audio.length))
        .send(Buffer.from(audio));
    } catch (err) {
      log.error({ err, text: text.slice(0, 50) }, "Sentence TTS failed");
      res.status(500).send("Speech generation failed");
    }
  };
}
