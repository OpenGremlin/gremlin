import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const BD_TIMEOUT_MS = 30_000;

export interface BdOptions {
  workingDir?: string;
}

/**
 * Invoke the `bd` CLI with the given arguments.
 *
 * Uses execFile (not exec) to avoid shell injection — arguments are
 * passed as an array and never interpolated into a shell string.
 *
 * Fails hard if `bd` falls back to the embedded Dolt backend (which
 * only supports one writer at a time). This means the Dolt server is
 * down or misconfigured — retrying won't help.
 */
export async function bd(args: string[], opts?: BdOptions): Promise<string> {
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
    const msg = execErr.message ?? String(err);

    if (msg.includes("embeddeddolt") || msg.includes("exclusive lock")) {
      throw new Error(
        `[bd] Dolt server unreachable — bd fell back to embedded mode. ` +
          `Ensure the Dolt server is running (docker compose up -d). ` +
          `Original error: ${msg}`,
      );
    }

    if (execErr.stderr) {
      // biome-ignore lint/suspicious/noConsole: no logger available in standalone client
      console.error(`[bd] stderr: ${execErr.stderr}`);
    }
    throw new Error(`bd ${args.join(" ")} failed: ${msg}`);
  }
}
