import { execSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolve the infra package directory (works from both src/ and dist/). */
function getInfraDir(): string {
  // From dist/cdk.js → ../../infra, from src/cdk.ts → ../../infra
  return path.resolve(__dirname, "../../infra");
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

// Foundation stacks that should be deleted last (everything else depends on them).
const FOUNDATION_STACKS = new Set([
  "GremlinVpcStack",
  "GremlinDatabaseStack",
  "GremlinAuthStack",
  "GremlinMediaStack",
]);

// The very last stack to delete — everything depends on VPC.
const LAST_STACK = "GremlinVpcStack";

/**
 * Destroy stacks iteratively: delete leaf stacks first (those with no
 * dependents), then work inward. Retries up to `maxPasses` times to
 * handle dependency chains of any depth.
 *
 * This is more robust than a hardcoded order because it handles unknown
 * stacks (e.g., legacy stacks from older deployments) and adapts to
 * whatever stack graph exists in the account.
 */
export function cdkDestroy(
  opts: CdkDeployOptions & { stacks?: string[] } = {},
): {
  destroyed: string[];
  failed: string[];
} {
  const infraDir = getInfraDir();
  const baseEnv: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >;
  if (opts.region) {
    baseEnv.CDK_DEFAULT_REGION = opts.region;
  }

  const destroyed: string[] = [];
  const remaining = new Set(opts.stacks ?? []);

  // If no stacks provided, try --all as a single pass
  if (remaining.size === 0) {
    const args = ["cdk", "destroy", "--all", "--force"];
    if (opts.profile) args.push(`--profile=${opts.profile}`);
    try {
      execSync(args.join(" "), {
        cwd: infraDir,
        stdio: "inherit",
        env: baseEnv,
      });
      return { destroyed: ["all"], failed: [] };
    } catch {
      return {
        destroyed: [],
        failed: ["--all (use gremlin destroy to retry)"],
      };
    }
  }

  const MAX_PASSES = 5;
  for (let pass = 0; pass < MAX_PASSES && remaining.size > 0; pass++) {
    const sizeBefore = remaining.size;

    // Try non-foundation stacks first, then foundation, VPC last
    const sorted = [...remaining].sort((a, b) => {
      if (a === LAST_STACK) return 1;
      if (b === LAST_STACK) return -1;
      const aFoundation = FOUNDATION_STACKS.has(a) ? 1 : 0;
      const bFoundation = FOUNDATION_STACKS.has(b) ? 1 : 0;
      return aFoundation - bFoundation;
    });

    for (const stack of sorted) {
      const args = ["cdk", "destroy", stack, "--force", "--exclusively"];
      if (opts.profile) args.push(`--profile=${opts.profile}`);

      try {
        execSync(args.join(" "), {
          cwd: infraDir,
          stdio: "inherit",
          env: baseEnv,
        });
        destroyed.push(stack);
        remaining.delete(stack);
      } catch {
        // Will retry on next pass — dependency may be gone by then
      }
    }

    // If no stacks were actually removed, remaining stacks are stuck
    if (remaining.size === sizeBefore) break;
  }

  return { destroyed, failed: [...remaining] };
}
