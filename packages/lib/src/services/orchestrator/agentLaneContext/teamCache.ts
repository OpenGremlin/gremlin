import type { TeamMember } from "./types.js";

// ── Team roster cache ────────────────────────────────────────────────
//
// Resolved team rosters are stable enough to cache between drain loops:
// the underlying data (member names + delegation hints) only changes when
// a user edits an agent. A short TTL gives us a free perf win for managers
// answering rapid-fire user messages without holding stale data for long.
// `activeDelegations` is *not* cached — those are time-sensitive.

const TEAM_CACHE_TTL_MS = 30_000;

interface CachedTeam {
  team: TeamMember[];
  expiresAt: number;
}

const teamCache = new Map<string, CachedTeam>();

export function getCachedTeam(managerId: string): TeamMember[] | null {
  const entry = teamCache.get(managerId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    teamCache.delete(managerId);
    return null;
  }
  return entry.team;
}

export function setCachedTeam(managerId: string, team: TeamMember[]): void {
  teamCache.set(managerId, {
    team,
    expiresAt: Date.now() + TEAM_CACHE_TTL_MS,
  });
}

/** Test helper: clear the team cache between cases. */
export function _clearTeamCache(): void {
  teamCache.clear();
}
