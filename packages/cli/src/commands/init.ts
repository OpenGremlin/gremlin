import { execSync } from "node:child_process";
import { confirm, input, password, select } from "@inquirer/prompts";
import chalk from "chalk";
import {
  checkPermissions,
  findGremlinStacks,
  getCallerIdentity,
  getStackOutputs,
} from "../aws.js";
import { cdkBootstrap, cdkDeploy } from "../cdk.js";
import { type GremlinConfig, loadConfig, saveConfig } from "../config.js";
import * as ui from "../ui.js";

/** List available AWS profiles from ~/.aws/config and ~/.aws/credentials. */
function listAwsProfiles(): string[] {
  try {
    const out = execSync("aws configure list-profiles", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function initCommand(): Promise<void> {
  ui.blank();
  ui.log(chalk.bold("Welcome to Gremlin"));
  ui.blank();

  // ── Check for existing deployment ────────────────────────
  const existing = loadConfig();
  if (existing?.aws) {
    try {
      const stacks = await findGremlinStacks(existing);
      if (stacks.length > 0) {
        const outputs = await getStackOutputs(existing, "GremlinAdminStack");
        const url = outputs?.AdminUrl ?? "unknown";
        ui.log(
          `Found existing Gremlin deployment in ${existing.aws.region} (account ${existing.aws.accountId})`,
        );
        ui.info(`Server: ${url}`);
        ui.blank();
        const resume = await confirm({
          message: "Resume using this deployment?",
          default: true,
        });
        if (resume) {
          ui.success("Using existing deployment");
          ui.blank();
          ui.info("Run gremlin status to see current state");
          ui.info("Run gremlin update to deploy latest changes");
          return;
        }
      }
    } catch {
      // Can't reach AWS — continue with fresh setup
    }
  }

  // ── AWS credentials ──────────────────────────────────────
  ui.log("Checking AWS credentials...");
  ui.blank();

  const profiles = listAwsProfiles();
  let profile: string | undefined;

  if (profiles.length > 1) {
    profile = await select({
      message: "AWS profile:",
      choices: profiles.map((p) => ({ name: p, value: p })),
    });

    // Set for subsequent AWS SDK calls
    process.env.AWS_PROFILE = profile;
  } else if (profiles.length === 1) {
    profile = profiles[0];
    process.env.AWS_PROFILE = profile;
  }

  let identity: Awaited<ReturnType<typeof getCallerIdentity>>;
  try {
    identity = await getCallerIdentity(null);
  } catch {
    ui.fail("No AWS credentials found");
    ui.blank();
    ui.info("Configure credentials with:");
    ui.info("  aws configure");
    ui.blank();
    ui.info("Or set environment variables:");
    ui.info("  export AWS_ACCESS_KEY_ID=...");
    ui.info("  export AWS_SECRET_ACCESS_KEY=...");
    ui.blank();
    ui.link("Guide", "https://opengremlin.com/docs/setup/aws-credentials");
    process.exit(1);
  }

  if (profile) {
    ui.log(`Using profile: ${chalk.bold(profile)}`);
  }
  ui.info(`Account:  ${identity.accountId}`);
  ui.info(`Identity: ${identity.arn}`);
  ui.blank();

  // ── Region ───────────────────────────────────────────────
  const region = await input({
    message: "AWS region:",
    default: process.env.AWS_DEFAULT_REGION ?? "us-east-1",
  });

  // Build initial config for AWS SDK calls
  const config: GremlinConfig = {
    version: "0.0.1",
    aws: {
      profile,
      region,
      accountId: identity.accountId,
      stackPrefix: "Gremlin",
    },
  };

  // ── Permission check ─────────────────────────────────────
  ui.blank();
  ui.log("Checking permissions...");

  const permissions = await checkPermissions(config, identity.arn);
  let hasRequired = true;
  for (const perm of permissions) {
    if (perm.allowed) {
      ui.success(perm.service);
    } else {
      ui.fail(`${perm.service} — missing permissions`);
      if (perm.service !== "CloudFront") {
        hasRequired = false;
      }
    }
  }

  if (!hasRequired) {
    ui.blank();
    ui.log(
      "Missing required permissions. Recommended: use the Gremlin setup policy",
    );
    ui.log("(least-privilege, scoped to what the installer needs):");
    ui.link("Policy", "https://opengremlin.com/docs/setup/aws-permissions");
    ui.blank();
    process.exit(1);
  }

  // ── Optional domain ──────────────────────────────────────
  ui.blank();
  const domain = await input({
    message: "Custom domain name (enter to skip):",
  });

  if (domain) {
    ui.blank();
    ui.info(
      "Providing a domain runs the same steps as `gremlin setup domain`.",
    );
    ui.info("Certificate validation may require adding a DNS record.");
    ui.link("Guide", "https://opengremlin.com/docs/setup/custom-domain#dns");
  }

  // ── Admin account ────────────────────────────────────────
  ui.blank();
  ui.log("Create your admin account:");
  const adminEmail = await input({ message: "Email:" });
  const adminPassword = await password({ message: "Password:" });

  if (!adminEmail || !adminPassword) {
    ui.fail("Email and password are required");
    process.exit(1);
  }

  // ── Bootstrap CDK ─────────────────────────────────────────
  ui.blank();
  ui.log("Bootstrapping CDK...");
  ui.blank();

  try {
    cdkBootstrap({ profile, region, accountId: identity.accountId });
    ui.success("CDK bootstrapped");
  } catch {
    ui.blank();
    ui.fail("CDK bootstrap failed");
    ui.link(
      "Troubleshooting",
      "https://opengremlin.com/docs/troubleshooting/deploy",
    );
    process.exit(1);
  }

  // ── Deploy ───────────────────────────────────────────────
  ui.blank();
  ui.log("Setting up AWS infrastructure...");
  ui.blank();

  try {
    const context: Record<string, string> = {};
    if (domain) {
      context.domain = domain;
    }
    context.adminEmail = adminEmail;
    context.adminPassword = adminPassword;

    cdkDeploy({ profile, region, context });
  } catch {
    ui.blank();
    ui.fail("CDK deploy failed");
    ui.link(
      "Troubleshooting",
      "https://opengremlin.com/docs/troubleshooting/deploy",
    );
    process.exit(1);
  }

  // ── Read outputs and save config ─────────────────────────
  const outputs = await getStackOutputs(config, "GremlinAdminStack");
  const serverUrl = outputs?.AdminUrl ?? `https://cloudfront-url-pending`;

  config.server = { url: domain ? `https://${domain}` : serverUrl };
  if (domain) {
    config.domain = domain;
  }
  saveConfig(config);

  ui.blank();
  ui.success(`Gremlin is running at ${config.server.url}`);
  ui.blank();
  ui.log("Next steps:");
  if (!domain) {
    ui.info("  gremlin setup domain    Add a custom domain with HTTPS");
  }
  ui.info("  gremlin setup gmail     Connect Gmail event source");
  ui.info("  gremlin status          See what's configured");
  ui.blank();
  ui.link("Docs", "https://opengremlin.com/docs/getting-started");
  ui.blank();
}
