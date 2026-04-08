import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import type { TeamMember } from "../orchestrator/agentLaneContext.js";
import type { Attachment } from "../tasks/attachment.js";

const attachmentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("file"),
    path: z.string().describe("Relative workspace file path"),
  }),
  z.object({
    type: z.literal("link"),
    url: z.string().url(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
]);

/**
 * `delegate` hands a self-contained task to a team member. Only available
 * to managers (`agent.config.manager.enabled`) and only for targets that
 * appear in `agent.config.manager.team`. Fire-and-forget: returns
 * immediately with the new taskId; the manager's main lane is free to
 * keep working. The teammate reports back via `task_update` inbox events
 * which wake the manager's main lane (see Phase 1).
 */
export function delegateTool(
  ctx: ServiceContext,
  managerAgentId: string,
  team: TeamMember[],
) {
  const teamById = new Map(team.map((m) => [m.id, m]));

  return tool({
    description:
      "Hand off a self-contained task to one of your team members. " +
      "The recipient cannot see this conversation, your tools, or the " +
      "user's earlier messages. Brief them as you would a smart " +
      "colleague who just walked into the room: state the goal, the " +
      "relevant context, what you've already ruled out, and what form " +
      "the answer should take. Terse one-line briefs produce shallow, " +
      "generic work. Use this only when a teammate is genuinely better " +
      "suited than you; for work you can do yourself, just do it or " +
      "use `backgroundTask`. The teammate may message you back during " +
      "or after the task — you'll see those updates in your inbox.",
    inputSchema: z.object({
      targetAgentId: z
        .string()
        .describe(
          "The id of the team member to delegate to. Must be one of your " +
            "current team members.",
        ),
      title: z
        .string()
        .describe(
          'Short title for the delegated task. Start with a verb, like a commit message (e.g. "Research competitor pricing", "Draft launch brief").',
        ),
      brief: z
        .string()
        .describe(
          "The full standalone instruction. Include goal, context, prior " +
            "work, constraints, and the desired form of the answer. " +
            "Assume zero shared history — the recipient sees only this " +
            "brief, not your conversation.",
        ),
      successCriteria: z
        .string()
        .optional()
        .describe(
          "Optional explicit definition of done. If the answer must hit " +
            "specific points or formats, list them here.",
        ),
      attachments: z
        .array(attachmentSchema)
        .optional()
        .describe(
          "Files or links to forward to the teammate as part of the brief.",
        ),
    }),
    execute: async ({
      targetAgentId,
      title,
      brief,
      successCriteria,
      attachments,
    }) => {
      // ACL: target must be in this manager's team. Use the pre-loaded
      // team roster from AgentLaneContext rather than re-fetching, so the
      // check is in-process and consistent with what the system prompt
      // showed the model.
      if (!teamById.has(targetAgentId)) {
        return {
          error: `Cannot delegate to ${targetAgentId}: not a member of your team. Available team members: ${[...teamById.keys()].join(", ") || "(none)"}.`,
        };
      }

      const task = await ctx.services.tasks.createTask(ctx, {
        agentId: targetAgentId,
        title,
        assignerAgentId: managerAgentId,
        brief,
        ...(successCriteria ? { successCriteria } : {}),
      });

      // Fire-and-forget: pick an emoji for the task card
      void ctx.services.tasks.selectAndSetTaskEmoji(ctx, task);

      await ctx.services.inbox.enqueueWork(
        ctx,
        targetAgentId,
        `task:${task.id}`,
        {
          type: "run_task",
          payload: {
            taskId: task.id,
            prompt: brief,
            ...(attachments?.length
              ? { attachments: attachments as Attachment[] }
              : {}),
          },
        },
      );

      return {
        taskId: task.id,
        targetAgentId,
        targetName: teamById.get(targetAgentId)?.name ?? targetAgentId,
        title,
        status: "accepted",
      };
    },
  });
}
