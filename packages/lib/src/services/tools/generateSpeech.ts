import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { SpeechModel } from "ai";
import { experimental_generateSpeech as generateSpeech, tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import { getWorkspacePath } from "./fileEditor/pathUtils.js";

/**
 * Tool that generates speech audio using the agent's configured speech model.
 * Saves the generated audio to the workspace, auto-attaches it to the
 * task so the user can hear it, and returns the file path.
 */
export function generateSpeechTool(
  ctx: ServiceContext,
  speechModel: SpeechModel,
  voice: string | undefined,
  taskId: string | null,
) {
  return tool({
    description:
      "Generate speech audio from text. The audio is saved to the workspace " +
      "and automatically attached to the task so the user can hear it. " +
      "Use this to create voiceovers, narration, or read text aloud.",
    inputSchema: z.object({
      text: z.string().describe("The text to convert to speech"),
    }),
    execute: async ({ text }) => {
      const result = await generateSpeech({
        model: speechModel,
        text,
        ...(voice ? { voice } : {}),
      });

      if (!result.audio) {
        return { error: "No audio was generated" };
      }

      // Save to workspace
      const workspace = getWorkspacePath();
      const audioDir = path.join(workspace, "generated-speech");
      await fs.mkdir(audioDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `speech-${timestamp}.mp3`;
      const filePath = path.join(audioDir, filename);
      const relativePath = path.relative(workspace, filePath);

      await fs.writeFile(filePath, result.audio.uint8Array);

      // Auto-attach to task so the user sees it in the UI
      if (taskId) {
        await ctx.services.tasks
          .addTaskAttachment(ctx, taskId, {
            type: "file",
            path: relativePath,
          })
          .catch(() => {});
      }

      return {
        path: relativePath,
        text,
      };
    },
  });
}
