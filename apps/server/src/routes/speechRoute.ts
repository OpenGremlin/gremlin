import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createLogger } from "@opengremlin/lib/logger.js";
import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import { getSpeechModelFromConfig } from "@opengremlin/lib/services/orchestrator/model.js";
import { generateSpeechAudio } from "@opengremlin/lib/services/speech/generateSpeechAudio.js";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { Request, Response } from "express";

const log = createLogger("speech");

function getWorkspacePath() {
  return path.resolve(process.env.WORKSPACE_PATH ?? "/workspace");
}

/**
 * GET /api/speech/:logId
 *
 * Generates TTS audio for an agent log entry on demand.
 * Caches the result on disk so subsequent requests are free.
 */
export function createSpeechRoute(resources: Resources, services: Services) {
  return async (req: Request, res: Response): Promise<void> => {
    const logId = req.params.logId;
    if (!logId) {
      res.status(400).send("Missing logId");
      return;
    }

    // Check for cached audio first
    const workspace = getWorkspacePath();
    const cacheDir = path.join(workspace, ".speech-cache");
    const cachePath = path.join(cacheDir, `${logId}.mp3`);

    try {
      const stat = await fs.stat(cachePath);
      if (stat.isFile()) {
        res
          .status(200)
          .set("Content-Type", "audio/mpeg")
          .set("Content-Length", String(stat.size))
          .set("Cache-Control", "public, max-age=86400");
        const handle = await fs.open(cachePath, "r");
        handle.createReadStream().pipe(res);
        return;
      }
    } catch {
      // Not cached — generate below
    }

    // Look up the log entry
    const { Item: logEntry } = await resources.ddb.entities.AgentLog.build(
      GetItemCommand,
    )
      .key({ id: logId })
      .send();

    if (!logEntry || logEntry.role !== "AGENT" || !logEntry.content) {
      res.status(404).send("Log not found or not speakable");
      return;
    }

    // Get the agent's speech config
    const { Item: agent } = await resources.ddb.entities.Agent.build(
      GetItemCommand,
    )
      .key({ id: logEntry.agentId })
      .send();

    if (!agent?.config?.speech?.enabled) {
      res.status(404).send("Speech not enabled for this agent");
      return;
    }

    const ctx = { resources, services, log };
    const speechModel = await getSpeechModelFromConfig(
      ctx as Parameters<typeof getSpeechModelFromConfig>[0],
      agent.config?.speechModel,
    );

    if (!speechModel) {
      res.status(500).send("No speech model configured");
      return;
    }

    const voice = agent.config?.speech?.voice ?? agent.ttsVoice;
    try {
      const audio = await generateSpeechAudio(
        speechModel,
        logEntry.content,
        voice,
      );

      if (!audio) {
        res.status(500).send("No audio generated");
        return;
      }

      // Cache to disk
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(cachePath, audio);

      res
        .status(200)
        .set("Content-Type", "audio/mpeg")
        .set("Content-Length", String(audio.length))
        .set("Cache-Control", "public, max-age=86400");
      res.send(Buffer.from(audio));
    } catch (err) {
      log.error({ err, logId }, "Failed to generate speech");
      res.status(500).send("Speech generation failed");
    }
  };
}
