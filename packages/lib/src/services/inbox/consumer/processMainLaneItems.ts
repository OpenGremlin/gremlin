import type { InboxItemItem } from "../../../resources/ddb/schema/inboxItem.js";
import type { ServiceContext } from "../../context.js";
import type { AgentLaneContext } from "../../orchestrator/agentLaneContext/index.js";
import { formatAndWriteInputRequestReply } from "./inputRequestReplies.js";

/** Process main-lane (conversational) items: write to log, then run one inference. */
export async function processMainLaneItems(
  ctx: ServiceContext,
  agentLaneCtx: AgentLaneContext,
  agentId: string,
  items: InboxItemItem[],
): Promise<void> {
  // Only run inference for items that need an agent response (user messages,
  // tasks needing assignment, epic completions). Informational items skip it.
  let shouldRunInference = false;

  for (const item of items) {
    const payload = JSON.parse(item.payload);
    switch (item.type) {
      case "user_message":
        await ctx.services.orchestrator.writeAgentLog(ctx, {
          agentId,
          taskId: null,
          role: "USER",
          content: payload.content,
        });
        shouldRunInference = true;
        break;
      case "user_input_request_reply":
        await formatAndWriteInputRequestReply(ctx, agentId, null, payload);
        shouldRunInference = true;
        break;
      case "tasks_need_assignment":
        await ctx.services.orchestrator.writeAgentLog(ctx, {
          agentId,
          taskId: null,
          role: "SYSTEM",
          content: `The following tasks are ready but need assignment: ${(payload.taskIds as string[]).join(", ")}. Review and assign them.`,
        });
        shouldRunInference = true;
        break;
      case "task_needs_attention":
        await ctx.services.orchestrator.writeAgentLog(ctx, {
          agentId,
          taskId: null,
          role: "SYSTEM",
          content:
            `Task ${payload.taskId} ("${payload.title ?? ""}") has been escalated. ` +
            `${payload.comment ? `Reason: "${payload.comment}". ` : ""}` +
            `Use \`taskShow\` to inspect. Fix the issue (e.g. add missing input, clarify instructions) then set status to "open" so the worker can resume.`,
        });
        shouldRunInference = true;
        break;
      case "task_ready_for_review":
        await ctx.services.orchestrator.writeAgentLog(ctx, {
          agentId,
          taskId: null,
          role: "SYSTEM",
          content:
            `Task ${payload.taskId} ("${payload.title ?? ""}") is closed. ` +
            `${payload.comment ? `Summary: "${payload.comment}". ` : ""}` +
            `Use \`taskShow\` to review. If the work needs revision, set status to "open" with feedback. ` +
            `If you're satisfied, create a post to the home feed summarizing it with the createPost tool.`,
        });
        shouldRunInference = true;
        break;
      case "top_level_task_complete":
        await ctx.services.orchestrator.writeAgentLog(ctx, {
          agentId,
          taskId: null,
          role: "SYSTEM",
          content:
            `Task ${payload.taskId} ("${payload.title ?? ""}") is complete. ` +
            `Create a post to the home feed summarizing the work. ` +
            `Use the createPost tool with this taskId. Write a concise title and a message ` +
            `of a few sentences summarizing what was accomplished. ` +
            `Attachments are collected automatically from the task and its subtasks.`,
        });
        shouldRunInference = true;
        break;
    }
  }

  if (shouldRunInference) {
    await ctx.services.orchestrator.runMainLane(ctx, agentLaneCtx, agentId);
  }
}
