import { createLogger } from "@opengremlin/lib/logger.js";
import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import { getSpeechModelFromConfig } from "@opengremlin/lib/services/orchestrator/model.js";
import { generateSpeechAudio } from "@opengremlin/lib/services/speech/generateSpeechAudio.js";
import type { Request, Response } from "express";

const log = createLogger("speech-sentence");

/**
 * GET /api/speech/sentence?text=<base64url>&voice=<voice>&connectionId=<id>
 *
 * Stateless TTS endpoint. Accepts sentence text and voice config as query
 * params, resolves the speech model, calls TTS, and returns the audio.
 */
export function createSpeechSentenceRoute(
  resources: Resources,
  services: Services,
) {
  return async (req: Request, res: Response): Promise<void> => {
    const { text: encodedText, voice, connectionId } = req.query;
    if (typeof encodedText !== "string" || typeof connectionId !== "string") {
      res.status(400).send("Missing text or connectionId");
      return;
    }

    let text: string;
    try {
      text = Buffer.from(encodedText, "base64url").toString("utf-8");
    } catch {
      res.status(400).send("Invalid text encoding");
      return;
    }

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
      const audio = await generateSpeechAudio(
        speechModel,
        text,
        typeof voice === "string" ? voice : undefined,
      );
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
