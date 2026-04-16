import type { ServiceContext } from "../../../context.js";
import { getCachedTeam, setCachedTeam } from "../teamCache.js";
import type { TeamMember } from "../types.js";

/**
 * Pre-load the team roster when manager mode is enabled. Roster is
 * cached per-manager with a short TTL — within the cache window we
 * skip the parallel getAgent + buildSkillBlurb fan-out. Failures are
 * tolerated per-member: a deleted teammate or a flaky S3 fetch
 * shouldn't break the manager's drain loop.
 */
export async function loadTeamRoster(
  ctx: ServiceContext,
  agentId: string,
  teamIds: string[],
): Promise<TeamMember[]> {
  if (teamIds.length === 0) return [];

  const cached = getCachedTeam(agentId);
  if (cached) return cached;

  // Fetch the agent record AND its skill blurb in parallel for
  // each member. The blurb is the most important routing signal
  // (skills + bound connections), so it pays to load eagerly.
  const memberResults = await Promise.all(
    teamIds.map(async (id) => {
      const [member, skillBlurb] = await Promise.all([
        ctx.services.agents.getAgent(ctx, id).catch((err) => {
          ctx.log.warn(
            { err, agentId, memberId: id, component: "manager" },
            "Failed to load team member",
          );
          return null;
        }),
        ctx.services.skills.buildSkillBlurb(ctx, id).catch((err) => {
          ctx.log.warn(
            { err, agentId, memberId: id, component: "manager" },
            "Failed to load team member skills",
          );
          return "";
        }),
      ]);
      return { member, skillBlurb };
    }),
  );

  const team: TeamMember[] = memberResults
    .filter(
      (
        r,
      ): r is {
        member: NonNullable<typeof r.member>;
        skillBlurb: string;
      } => r.member != null && !r.member.retired,
    )
    .map((r) => ({
      id: r.member.id,
      name: r.member.name,
      delegationHint: r.member.delegationHint,
      role: r.member.role,
      skillBlurb: r.skillBlurb,
    }));

  setCachedTeam(agentId, team);
  return team;
}
