/**
 * Tracks which lanes are currently draining.
 * When a lane finishes a turn it always re-checks the inbox,
 * so a doorbell that arrives while a lane is active is safe to ignore.
 */
export const activeLanes = new Set<string>();

export function laneKey(agentId: string, lane: string): string {
  return `${agentId}#${lane}`;
}
