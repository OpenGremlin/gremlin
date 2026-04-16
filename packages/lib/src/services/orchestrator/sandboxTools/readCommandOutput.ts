import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import type { ReadOutputResult } from "../../sandbox/types.js";
import {
  ToolErrorCode,
  toolErr,
  toolOk,
  wrapExecute,
} from "../../tools/toolResult.js";
import { activeSessions } from "./sessionRegistry.js";

export function readCommandOutputTool(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
) {
  return tool({
    description:
      "Read a portion of a previous command's full output. Use this when runCommand indicates output was truncated and you need to see more. Supports reading specific byte ranges from stdout or stderr.",
    inputSchema: z.object({
      commandId: z
        .string()
        .describe("The commandId returned by the truncated runCommand call"),
      stream: z
        .enum(["stdout", "stderr"])
        .optional()
        .describe("Which stream to read (default: stdout)"),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Byte offset to start reading from (default: 0)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(65536)
        .optional()
        .describe("Maximum bytes to read (default: 8192, max: 65536)"),
    }),
    execute: wrapExecute(
      "readCommandOutput",
      async ({ commandId, stream, offset, limit }) => {
        const resolvedStream = stream ?? "stdout";
        const resolvedOffset = offset ?? 0;
        const resolvedLimit = limit ?? 8192;
        const session = activeSessions.get(taskId);
        if (!session?.ws || session.ws.readyState !== session.ws.OPEN) {
          return toolErr(
            ToolErrorCode.InvalidInput,
            "Sandbox session not connected",
            "Call `ensureSandbox` first to initialize the sandbox.",
          );
        }

        session.lastActivityAt = Date.now();

        let result: ReadOutputResult;
        try {
          result = await ctx.services.sandbox.readOutput(session, commandId, {
            stream: resolvedStream,
            offset: resolvedOffset,
            limit: resolvedLimit,
          });
        } catch (err) {
          ctx.log.error(
            {
              agentId,
              taskId,
              commandId,
              error: (err as Error).message,
              component: "sandbox:tools",
            },
            "readOutput failed",
          );
          return toolErr(
            ToolErrorCode.InternalError,
            (err as Error).message,
            "The command output may no longer be available. Try running the command again.",
          );
        }

        return toolOk({
          data: result.data,
          stream: result.stream,
          offset: result.offset,
          bytesRead: result.bytesRead,
          totalBytes: result.totalBytes,
        });
      },
    ),
  });
}
