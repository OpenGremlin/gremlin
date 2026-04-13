import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { BeadSummary, BeadsClient } from "./reconcileBeads.js";

const execFileAsync = promisify(execFile);

const BD_TIMEOUT_MS = 30_000;

// ── CLI helper ─────────────────────────────────────────────────────

interface BdOptions {
  workingDir?: string;
}

/**
 * Invoke the `bd` CLI with the given arguments.
 *
 * Uses execFile (not exec) to avoid shell injection — arguments are
 * passed as an array and never interpolated into a shell string.
 */
async function bd(args: string[], opts?: BdOptions): Promise<string> {
  const bin = process.env.BD_PATH ?? "bd";
  const cwd = opts?.workingDir ?? process.env.BEADS_WORKING_DIR;

  const env: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >;
  if (process.env.BEADS_DOLT_SERVER_HOST) {
    env.BEADS_DOLT_SERVER_HOST = process.env.BEADS_DOLT_SERVER_HOST;
  }
  if (process.env.BEADS_DOLT_SERVER_PORT) {
    env.BEADS_DOLT_SERVER_PORT = process.env.BEADS_DOLT_SERVER_PORT;
  }

  try {
    const { stdout } = await execFileAsync(bin, args, {
      cwd,
      env,
      timeout: BD_TIMEOUT_MS,
    });
    return stdout;
  } catch (err: unknown) {
    const execErr = err as { stderr?: string; message?: string };
    if (execErr.stderr) {
      // biome-ignore lint/suspicious/noConsole: no logger available in standalone client
      console.error(`[bdClient] stderr: ${execErr.stderr}`);
    }
    throw new Error(
      `bd ${args.join(" ")} failed: ${execErr.message ?? String(err)}`,
    );
  }
}

// ── Field mapping ──────────────────────────────────────────────────

interface BdIssueRaw {
  id: string;
  title: string;
  description: string;
  status: string;
  assignee?: string;
  parent?: string;
  issue_type?: string;
  epic_closeable?: boolean;
  epic_total_children?: number;
  epic_closed_children?: number;
}

function mapToBeadSummary(raw: BdIssueRaw): BeadSummary {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    status: raw.status,
    assignee: raw.assignee,
    parentId: raw.parent,
    type: raw.issue_type,
    epic_closeable: raw.epic_closeable,
  };
}

// ── Factory ────────────────────────────────────────────────────────

export function createBdClient(opts?: { workingDir?: string }): BeadsClient {
  const bdOpts: BdOptions = { workingDir: opts?.workingDir };

  return {
    async readyWork(): Promise<BeadSummary[]> {
      const raw = await bd(["ready", "--json"], bdOpts);
      const issues: BdIssueRaw[] = JSON.parse(raw);
      return issues.map(mapToBeadSummary);
    },

    async updateIssue(params: {
      issue_id: string;
      status?: string;
      notes?: string;
    }): Promise<void> {
      const args = ["update", params.issue_id];
      if (params.status) {
        args.push("--status", params.status);
      }
      if (params.notes) {
        args.push("--note", params.notes);
      }
      await bd(args, bdOpts);
    },

    async showIssue(params: { issue_id: string }): Promise<BeadSummary> {
      const raw = await bd(["show", params.issue_id, "--json"], bdOpts);
      const parsed = JSON.parse(raw);
      // bd show returns an array even for a single bead
      const issue: BdIssueRaw = Array.isArray(parsed) ? parsed[0] : parsed;
      return mapToBeadSummary(issue);
    },

    async closeIssue(params: {
      issue_id: string;
      reason?: string;
    }): Promise<void> {
      const args = ["close", params.issue_id];
      if (params.reason) {
        args.push("--reason", params.reason);
      }
      await bd(args, bdOpts);
    },

    async getComments(params: {
      issue_id: string;
    }): Promise<Array<{ id: string; text: string; created_at: string }>> {
      const raw = await bd(["comments", params.issue_id, "--json"], bdOpts);
      const comments: Array<{
        id: string;
        issue_id: string;
        author: string;
        text: string;
        created_at: string;
      }> = JSON.parse(raw);
      return comments.map((c) => ({
        id: c.id,
        text: c.text,
        created_at: c.created_at,
      }));
    },

    async getChildren(params: { issue_id: string }): Promise<BeadSummary[]> {
      const raw = await bd(["children", params.issue_id, "--json"], bdOpts);
      const children: BdIssueRaw[] = JSON.parse(raw);
      return children.map(mapToBeadSummary);
    },

    async listIssues(params?: {
      status?: string;
      type?: string;
      assignee?: string;
    }): Promise<BeadSummary[]> {
      const args = ["list", "--json"];
      if (params?.status) {
        args.push("--status", params.status);
      }
      if (params?.type) {
        args.push("--type", params.type);
      }
      if (params?.assignee) {
        args.push("--assignee", params.assignee);
      }
      const raw = await bd(args, bdOpts);
      const issues: BdIssueRaw[] = JSON.parse(raw);
      return issues.map(mapToBeadSummary);
    },
  };
}
