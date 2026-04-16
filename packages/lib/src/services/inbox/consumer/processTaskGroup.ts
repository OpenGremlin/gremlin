import type { InboxItemItem } from "../../../resources/ddb/schema/inboxItem.js";
import type { ServiceContext } from "../../context.js";
import type { AgentLaneContext } from "../../orchestrator/agentLaneContext/index.js";
import type { Attachment } from "../../tasks/attachment.js";
import { buildInputRequestReplyContent } from "./inputRequestReplies.js";

/** Write all messages for a task to the log, then run one inference. */
export async function processTaskGroup(
  ctx: ServiceContext,
  agentLaneCtx: AgentLaneContext,
  agentId: string,
  taskId: string,
  items: InboxItemItem[],
) {
  const prompts: Array<{
    content: string;
    role: "SYSTEM" | "USER";
    attachments?: Attachment[];
  }> = [];

  for (const item of items) {
    const payload = JSON.parse(item.payload);
    switch (item.type) {
      case "run_task":
        prompts.push({
          content: payload.prompt,
          role: "SYSTEM",
          attachments: payload.attachments,
        });
        break;
      case "user_task_message":
        prompts.push({ content: payload.content, role: "USER" });
        break;
      case "user_input_request_reply": {
        const reply = await buildInputRequestReplyContent(ctx, payload);
        prompts.push({ content: reply, role: "SYSTEM" });
        break;
      }
      case "task_ready_for_review":
        prompts.push({
          content:
            `Task ${payload.taskId} ("${payload.title ?? ""}") is closed. ` +
            `${payload.comment ? `Summary: "${payload.comment}". ` : ""}` +
            `Use \`taskShow\` to review. If the work needs revision, set status to "open" with feedback. ` +
            `Otherwise, no action is needed — the task is already closed.`,
          role: "SYSTEM",
        });
        break;
      case "task_needs_attention":
        prompts.push({
          content:
            `Task ${payload.taskId} ("${payload.title ?? ""}") has been escalated. ` +
            `${payload.comment ? `Reason: "${payload.comment}". ` : ""}` +
            `Use \`taskShow\` to inspect. Fix the issue then set status to "open" so the worker can resume.`,
          role: "SYSTEM",
        });
        break;
      case "tasks_need_assignment":
        prompts.push({
          content: `The following tasks are ready but need assignment: ${(payload.taskIds as string[]).join(", ")}. Review and assign them.`,
          role: "SYSTEM",
        });
        break;
    }
  }

  if (prompts.length === 0) return;

  // Write all prompts to the log except the last one (runTaskLane writes that)
  for (let i = 0; i < prompts.length - 1; i++) {
    await ctx.services.orchestrator.writeAgentLog(ctx, {
      agentId,
      taskId,
      role: prompts[i].role,
      content: prompts[i].content,
      attachments: prompts[i].attachments,
    });
  }

  // Run one inference with the last prompt
  const last = prompts[prompts.length - 1];
  await ctx.services.orchestrator.runTaskLane(
    ctx,
    agentLaneCtx,
    taskId,
    last.content,
    {
      role: last.role === "USER" ? "USER" : undefined,
      attachments: last.attachments,
    },
  );
}
