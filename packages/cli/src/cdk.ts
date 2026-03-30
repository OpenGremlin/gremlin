import { execSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolve the infra package directory (works from both src/ and dist/). */
function getInfraDir(): string {
  // From dist/cdk.js → ../../infra, from src/cdk.ts → ../../infra
  return path.resolve(__dirname, "../../infra");
}

export interface CdkDeployOptions {
  profile?: string;
  region?: string;
  context?: Record<string, string>;
}

/** Run `cdk deploy --all` in the infra package. */
export function cdkDeploy(opts: CdkDeployOptions = {}): void {
  const infraDir = getInfraDir();
  const args = ["cdk", "deploy", "--all", "--require-approval=never"];

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

  execSync(args.join(" "), {
    cwd: infraDir,
    stdio: "inherit",
    env,
  });
}

/** Run `cdk destroy --all` in the infra package. */
export function cdkDestroy(opts: CdkDeployOptions = {}): void {
  const infraDir = getInfraDir();
  const args = ["cdk", "destroy", "--all", "--force"];

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
