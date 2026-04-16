import type { ServiceContext } from "../../../context.js";
import type { ActiveDelegation, TeamMember } from "../types.js";

/**
 * Active delegations: open tasks the manager has assigned to its team.
 * Fetched fresh per drain loop — these change as work flows. We scan
 * each team member's tasks in parallel and filter for the ones whose
 * assignerAgentId points back to us.
 */
export async function loadActiveDelegations(
  ctx: ServiceContext,
  agentId: string,
  team: TeamMember[],
): Promise<ActiveDelegation[]> {
  if (team.length === 0) return [];

  const taskLists = await Promise.all(
    team.map((member) =>
      ctx.services.tasks.getTasksByAgent(ctx, member.id).catch((err) => {
        ctx.log.warn(
          { err, agentId, memberId: member.id, component: "manager" },
          "Failed to fetch member tasks for active delegations roster",
        );
        return [];
      }),
    ),
  );

  return team.flatMap((member, i) =>
    taskLists[i]
      .filter((task) => task.assignerAgentId === agentId)
      .map((task) => ({
        taskId: task.id,
        targetId: member.id,
        targetName: member.name,
        title: task.title,
      })),
  );
}
