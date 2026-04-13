import type { Tool } from "ai";
import type { ServiceContext } from "../context.js";

/**
 * Build the beads MCP tool set for the current workspace.
 *
 * TODO: Wire these to the beads MCP server (Dolt-backed). Each tool
 * (beads_create_issue, beads_update_issue, beads_close_issue,
 * beads_show_issue, beads_list_issues, beads_ready_work, etc.) will be
 * proxied through the MCP client using `set_context` for workspace routing.
 * For now returns an empty record so the spread in runMainLane is a no-op.
 */
export function buildBeadsMcpTools(_ctx: ServiceContext): Record<string, Tool> {
  // TODO: connect to beads MCP server and return real tools
  return {};
}
