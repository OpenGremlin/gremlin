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

// Destroy order: reverse dependency order so dependents go first.
// Each group is destroyed sequentially; stacks within a group are independent.
const DESTROY_ORDER = [
  // 5. Web app — depends on Auth, Server
  ["GremlinAdminStack"],
  // 4. Sandbox — depends on VPC, Server, Database
  ["GremlinSandboxEc2Stack"],
  // 3. Messaging — depends on Server
  ["GremlinMessagingStack"],
  // 2. Server — depends on VPC, Database, Auth, Media
  ["GremlinServerStack"],
  // 1. Foundation — independent of each other
  ["GremlinDatabaseStack", "GremlinAuthStack", "GremlinMediaStack"],
  // 0. Network — no dependents left
  ["GremlinVpcStack"],
];

/**
 * Destroy stacks in reverse dependency order.
 * Skips stacks that don't exist. Continues to next group on failure
 * so downstream stacks still get cleaned up where possible.
 */
export function cdkDestroy(opts: CdkDeployOptions = {}): {
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
  const failed: string[] = [];

  for (const group of DESTROY_ORDER) {
    for (const stack of group) {
      const args = ["cdk", "destroy", stack, "--force"];
      if (opts.profile) {
        args.push(`--profile=${opts.profile}`);
      }

      try {
        execSync(args.join(" "), {
          cwd: infraDir,
          stdio: "inherit",
          env: baseEnv,
        });
        destroyed.push(stack);
      } catch {
        failed.push(stack);
      }
    }
  }

  return { destroyed, failed };
}
