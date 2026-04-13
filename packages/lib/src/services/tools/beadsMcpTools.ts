import { type Tool, tool } from "ai";
import { z } from "zod";

import type { BeadIssueEvent } from "../../resources/pubsub.js";
import type { ServiceContext } from "../context.js";
import { bd } from "../orchestrator/bdExec.js";

/**
 * Run a bd command and parse JSON output. Returns the parsed object,
 * or an error object if the command fails.
 */
async function bdJson(args: string[]): Promise<unknown> {
  try {
    const raw = await bd(args);
    return JSON.parse(raw);
  } catch (err: unknown) {
    return { error: String(err) };
  }
}

/** Parse a `bd show --json` result into a single issue object. */
function parseBdShow(raw: string) {
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

/**
 * Fetch a bead and publish a `beadUpdated` event for it.
 * Only meaningful for top-level beads (epics or parentless tasks) — those are
 * the ones clients subscribe to. Includes children so the BeadCard renders
 * the full tree.
 *
 * Best-effort: pub/sub failures are logged but don't break the tool call.
 */
async function publishBeadUpdated(
  ctx: ServiceContext,
  beadId: string,
): Promise<void> {
  try {
    const issue = parseBdShow(await bd(["show", beadId, "--json"]));

    const childrenRaw = await bd(["children", beadId, "--json"]).catch(
      () => "[]",
    );
    const children = JSON.parse(childrenRaw);

    const event: BeadIssueEvent = {
      id: issue.id,
      title: issue.title,
      status: issue.status,
      assignee: issue.assignee ?? undefined,
      children: children.map(
        (c: { id: string; title: string; status: string; assignee?: string; parent?: string }) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          assignee: c.assignee ?? undefined,
          parent_id: c.parent ?? undefined,
        }),
      ),
    };

    ctx.resources.pubsub.publish(`beadUpdated:${beadId}`, event);
  } catch (err) {
    // biome-ignore lint/suspicious/noConsole: best-effort, no logger available
    console.error(`[beads] publishBeadUpdated(${beadId}):`, err);
  }
}

/**
 * Fetch a bead and return its parent ID (if any).
 * Also publishes a `beadUpdated` event for the resolved top-level bead,
 * avoiding a redundant `bd show` call from the caller.
 */
async function publishForIssue(
  ctx: ServiceContext,
  issueId: string,
): Promise<void> {
  try {
    const issue = parseBdShow(await bd(["show", issueId, "--json"]));
    const parentId: string | undefined = issue.parent;
    await publishBeadUpdated(ctx, parentId ?? issueId);
  } catch (err) {
    // biome-ignore lint/suspicious/noConsole: best-effort
    console.error(`[beads] publishForIssue(${issueId}):`, err);
  }
}

// ── Tool definitions ──────────────────────────────────────────────

/**
 * Build the beads MCP tool set for the current workspace.
 *
 * Each tool shells out to the `bd` CLI and returns structured JSON.
 * The tools give LLM agents the ability to create, query, and manage
 * beads (issues / tasks / epics) in the workspace's Dolt-backed
 * project tracker.
 */
export function buildBeadsMcpTools(ctx: ServiceContext): Record<string, Tool> {
  return {
    beads_create_issue: tool({
      description:
        "Create a new bead (issue/task/epic) in the project tracker. Use this when the user or plan requires a new work item, subtask, or epic to be tracked.",
      inputSchema: z.object({
        title: z.string().describe("Short title for the bead"),
        description: z
          .string()
          .optional()
          .describe("Longer description of what needs to be done"),
        type: z
          .enum(["task", "epic", "bug"])
          .default("task")
          .describe("Issue type: task (default), epic, or bug"),
        priority: z
          .number()
          .int()
          .min(0)
          .max(4)
          .optional()
          .describe("Priority 0 (highest) to 4 (lowest)"),
        assignee: z
          .string()
          .optional()
          .describe('Agent ID to assign, or "self" for the current agent'),
        parent: z
          .string()
          .optional()
          .describe("Parent bead ID (e.g. an epic ID) to nest under"),
        blocked_by: z
          .array(z.string())
          .optional()
          .describe(
            "Array of bead IDs that must complete before this bead can start",
          ),
        defer_until: z
          .string()
          .optional()
          .describe(
            "ISO 8601 date string — bead won't appear in ready queue until this date",
          ),
      }),
      execute: async ({
        title,
        description,
        type,
        priority,
        assignee,
        parent,
        blocked_by,
        defer_until,
      }) => {
        const args = ["create", title, "--json"];
        if (description) args.push("--description", description);
        if (type) args.push("--type", type);
        if (priority !== undefined) args.push("--priority", String(priority));
        if (assignee) args.push("--assignee", assignee);
        if (parent) args.push("--parent", parent);
        if (defer_until) args.push("--defer-until", defer_until);

        const result = await bdJson(args);

        // Add dependency edges if requested
        if (
          blocked_by &&
          blocked_by.length > 0 &&
          typeof result === "object" &&
          result !== null &&
          "id" in result
        ) {
          const createdId = (result as { id: string }).id;
          for (const depId of blocked_by) {
            await bd(["dep", "add", createdId, depId, "--type", "blocks"]);
          }
        }

        // Notify parent epic so its BeadCard updates in real time.
        // Top-level creates don't publish — no client is subscribed yet.
        if (parent) {
          await publishBeadUpdated(ctx, parent);
        }

        return result;
      },
    }),

    beads_show_issue: tool({
      description:
        "Show full details of a single bead by ID. Use this to inspect status, description, dependencies, or assignee of a specific work item.",
      inputSchema: z.object({
        issue_id: z.string().describe("The bead ID to look up"),
      }),
      execute: async ({ issue_id }) => {
        return bdJson(["show", issue_id, "--json"]);
      },
    }),

    beads_update_issue: tool({
      description:
        "Update fields on an existing bead (status, assignee) and optionally add a comment. Use this to move beads through workflow states or reassign work.",
      inputSchema: z.object({
        issue_id: z.string().describe("The bead ID to update"),
        status: z
          .string()
          .optional()
          .describe(
            "New status (e.g. open, in_progress, blocked, review, done)",
          ),
        assignee: z.string().optional().describe("New assignee agent ID"),
        notes: z
          .string()
          .optional()
          .describe("A comment to add to the bead's activity log"),
      }),
      execute: async ({ issue_id, status, assignee, notes }) => {
        const args = ["update", issue_id];
        if (status) args.push("--status", status);
        if (assignee) args.push("--assignee", assignee);

        try {
          await bd(args);
        } catch (err) {
          return { error: String(err) };
        }

        // Add comment separately if notes provided
        if (notes) {
          try {
            await bd(["comment", issue_id, notes]);
          } catch (err) {
            return { error: `Update succeeded but comment failed: ${err}` };
          }
        }

        // Publish update — parent epic if this is a child, otherwise self.
        // publishForIssue does a single bd show to find the parent.
        await publishForIssue(ctx, issue_id);

        return { success: true, issue_id };
      },
    }),

    beads_close_issue: tool({
      description:
        "Close a bead, marking it as complete. Use this when a task or epic is finished.",
      inputSchema: z.object({
        issue_id: z.string().describe("The bead ID to close"),
        reason: z
          .string()
          .optional()
          .describe("Reason for closing (e.g. completed, duplicate, wontfix)"),
      }),
      execute: async ({ issue_id, reason }) => {
        const args = ["close", issue_id];
        if (reason) args.push("--reason", reason);

        try {
          await bd(args);
        } catch (err) {
          return { error: String(err) };
        }

        await publishForIssue(ctx, issue_id);

        return { success: true, issue_id };
      },
    }),

    beads_list_issues: tool({
      description:
        "List beads in the project tracker, optionally filtered by status, type, or assignee. Use this to survey current work items or find beads matching criteria.",
      inputSchema: z.object({
        status: z
          .string()
          .optional()
          .describe("Filter by status (e.g. open, in_progress, done)"),
        type: z
          .string()
          .optional()
          .describe("Filter by type (e.g. task, epic, bug)"),
        assignee: z.string().optional().describe("Filter by assignee agent ID"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe("Max number of results to return (default 20)"),
      }),
      execute: async ({ status, type, assignee, limit }) => {
        const args = ["list", "--json"];
        if (status) args.push("--status", status);
        if (type) args.push("--type", type);
        if (assignee) args.push("--assignee", assignee);
        if (limit) args.push("--limit", String(limit));

        return bdJson(args);
      },
    }),

    beads_ready_work: tool({
      description:
        "List beads that are ready to work on — all dependencies are satisfied and the bead is not deferred. Use this to find the next actionable items.",
      inputSchema: z.object({
        parent: z
          .string()
          .optional()
          .describe(
            "Filter to children of a specific parent bead (e.g. an epic)",
          ),
        assignee: z.string().optional().describe("Filter by assignee agent ID"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Max number of results to return"),
      }),
      execute: async ({ parent, assignee, limit }) => {
        const args = ["ready", "--json"];
        if (parent) args.push("--parent", parent);
        if (assignee) args.push("--assignee", assignee);
        if (limit) args.push("--limit", String(limit));

        return bdJson(args);
      },
    }),

    beads_add_dependency: tool({
      description:
        "Add a dependency edge between two beads. This means issue_id cannot start until depends_on_id is complete.",
      inputSchema: z.object({
        issue_id: z
          .string()
          .describe("The bead that depends on another (the blocked bead)"),
        depends_on_id: z
          .string()
          .describe("The bead that must complete first (the blocker)"),
        dep_type: z
          .string()
          .default("blocks")
          .describe('Dependency type (default "blocks")'),
      }),
      execute: async ({ issue_id, depends_on_id, dep_type }) => {
        try {
          await bd(["dep", "add", issue_id, depends_on_id, "--type", dep_type]);
          return { success: true, issue_id, depends_on_id, dep_type };
        } catch (err) {
          return { error: String(err) };
        }
      },
    }),

    beads_blocked: tool({
      description:
        "List beads that are currently blocked by unresolved dependencies. Use this to identify bottlenecks in the project.",
      inputSchema: z.object({
        parent: z
          .string()
          .optional()
          .describe("Filter to children of a specific parent bead"),
      }),
      execute: async ({ parent }) => {
        const args = ["blocked", "--json"];
        if (parent) args.push("--parent", parent);

        return bdJson(args);
      },
    }),

    beads_stats: tool({
      description:
        "Get aggregate statistics for the project tracker — counts by status, type, and other breakdowns. Use this for status reports or to understand project health.",
      inputSchema: z.object({}),
      execute: async () => {
        return bdJson(["stats", "--json"]);
      },
    }),
  };
}
