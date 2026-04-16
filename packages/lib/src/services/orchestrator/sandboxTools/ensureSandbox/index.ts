import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../../context.js";
import {
  ToolErrorCode,
  toolErr,
  toolOk,
  wrapExecute,
} from "../../../tools/toolResult.js";
import { ensureSandbox } from "./ensureSandbox.js";

export function ensureSandboxTool(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
) {
  return tool({
    description:
      "Ensure the sandbox is online and ready for commands. Call this FIRST — before readSkill, authenticate, or runCommand. If the sandbox is already running, returns immediately. If it needs to boot, this call blocks until it's ready (may take a few minutes).",
    inputSchema: z.object({}),
    execute: wrapExecute("ensureSandbox", async () => {
      try {
        await ensureSandbox(ctx, agentId, taskId);
      } catch (err) {
        ctx.log.error(
          {
            agentId,
            error: (err as Error).message,
            stack: (err as Error).stack,
            component: "sandbox:tools",
          },
          "ensureSandbox failed",
        );
        return toolErr(
          ToolErrorCode.InternalError,
          (err as Error).message,
          "The sandbox infrastructure is unreachable. Try again in a moment.",
        );
      }

      return toolOk({ status: "ready" as const });
    }),
  });
}
