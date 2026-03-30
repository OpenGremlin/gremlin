import { execSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as ui from "./ui.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Lines that are useful to show the user. */
const SHOW_PATTERNS = [
  /^\s*✅/,
  /^\s*❌/,
  /^✨/,
  /^\s*Gremlin\w*Stack\s*\|/, // CDK stack event lines
  /^\s*Gremlin\w*Stack$/, // stack name header
  /^\s*Gremlin\w*Stack: deploying/,
  /^Outputs:/,
  /Stack ARN:/,
  /^Gremlin\w*Stack\./, // stack output lines
  /^\[Error/,
  /^Error:/,
  /^ERROR:/,
  /^Failed/,
  /^found errors/i,
  /^Gremlin\w*Stack: fail:/,
];

/** Lines from bundling/docker that update the spinner message. */
const PHASE_PATTERNS: [RegExp, string][] = [
  [/^Bundling asset (\S+)/, "Bundling $1"],
  [/^Gremlin\w*Stack: start: Building (\S+)/, "Building $1"],
  [/^Gremlin\w*Stack: success: Built (\S+)/, "Built $1"],
  [/^Gremlin\w*Stack: creating CloudFormation changeset/, "Creating changeset"],
  [/^Starting Metro Bundler/, "Building web app"],
  [/^Web .* Bundled/, "Web app bundled"],
  [/^Exported:/, "Web app exported"],
  [/^#\d+ /, "Building Docker image"],
];

function getPhaseMessage(line: string): string | null {
  for (const [pattern, template] of PHASE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return template.replace("$1", match[1] ?? "");
    }
  }
  return null;
}

function shouldShow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return SHOW_PATTERNS.some((p) => p.test(trimmed));
}

/** Run a command with a spinner, showing only meaningful output lines. */
function runWithSpinner(
  args: string[],
  opts: { cwd: string; env: Record<string, string> },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(args[0], args.slice(1), {
      cwd: opts.cwd,
      env: opts.env,
      stdio: ["inherit", "pipe", "pipe"],
    });

    const spin = ui.spinner("Synthesizing");

    function handleLine(line: string) {
      const phase = getPhaseMessage(line);
      if (phase) {
        spin.update(phase);
        return;
      }

      if (shouldShow(line)) {
        spin.stop();
        process.stderr.write(`${line}\n`);
        spin.update(spin.message);
      }
    }

    let stdoutBuf = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBuf += chunk.toString();
      const lines = stdoutBuf.split("\n");
      stdoutBuf = lines.pop() ?? "";
      for (const line of lines) handleLine(line);
    });

    let stderrBuf = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString();
      const lines = stderrBuf.split("\n");
      stderrBuf = lines.pop() ?? "";
      for (const line of lines) handleLine(line);
    });

    child.on("close", (code) => {
      if (stdoutBuf.trim()) handleLine(stdoutBuf);
      if (stderrBuf.trim()) handleLine(stderrBuf);
      spin.stop();

      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

/** Resolve the infra package directory (works from both src/ and dist/). */
function getInfraDir(): string {
  // From dist/cdk.js → ../../infra, from src/cdk.ts → ../../infra
  const dir = path.resolve(__dirname, "../../infra");
  if (!existsSync(path.join(dir, "cdk.json"))) {
    throw new Error(
      "Cannot find packages/infra. Run this CLI from the gremlin repo: pnpm gremlin",
    );
  }
  return dir;
}

/** Run `cdk bootstrap` to prepare the account/region for CDK deploys. */
export function cdkBootstrap(opts: {
  profile?: string;
  region?: string;
  accountId?: string;
}): void {
  const infraDir = getInfraDir();
  const args = ["cdk", "bootstrap"];

  if (opts.accountId && opts.region) {
    args.push(`aws://${opts.accountId}/${opts.region}`);
  }

  if (opts.profile) {
    args.push(`--profile=${opts.profile}`);
  }

  const env: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >;
  if (opts.region) {
    env.CDK_DEFAULT_REGION = opts.region;
  }

  execSync(args.join(" "), {
    cwd: infraDir,
    stdio: "inherit",
    env,
  });
}

export interface CdkDeployOptions {
  profile?: string;
  region?: string;
  context?: Record<string, string>;
}

/** Run `cdk deploy --all` in the infra package. */
export async function cdkDeploy(opts: CdkDeployOptions = {}): Promise<void> {
  const infraDir = getInfraDir();
  const args = [
    "cdk",
    "deploy",
    "--all",
    "--require-approval=never",
    "--ci",
    "--progress=events",
  ];

  if (opts.profile) {
    args.push(`--profile=${opts.profile}`);
  }

  for (const [key, value] of Object.entries(opts.context ?? {})) {
    args.push(`-c`, `${key}=${value}`);
  }

  const env: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >;
  if (opts.region) {
    env.CDK_DEFAULT_REGION = opts.region;
  }

  await runWithSpinner(args, { cwd: infraDir, env });
}

/** Destroy all stacks defined in the CDK app. */
export async function cdkDestroy(opts: CdkDeployOptions = {}): Promise<void> {
  const infraDir = getInfraDir();
  const env: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >;
  if (opts.region) {
    env.CDK_DEFAULT_REGION = opts.region;
  }

  const args = ["cdk", "destroy", "--all", "--force"];
  if (opts.profile) args.push(`--profile=${opts.profile}`);

  await runWithSpinner(args, { cwd: infraDir, env });
}
