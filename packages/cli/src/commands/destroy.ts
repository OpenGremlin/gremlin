import { input } from "@inquirer/prompts";
import chalk from "chalk";
import { findGremlinStacks, getCallerIdentity } from "../aws.js";
import { cdkDestroy } from "../cdk.js";
import { loadConfig } from "../config.js";
import * as ui from "../ui.js";

export async function destroyCommand(): Promise<void> {
  const config = loadConfig();

  // Try to get identity from current AWS credentials, even without local config
  let accountId: string;
  let region: string;
  let profile: string | undefined;

  if (config?.aws) {
    accountId = config.aws.accountId;
    region = config.aws.region;
    profile = config.aws.profile;
    if (profile) process.env.AWS_PROFILE = profile;
  } else {
    // No local config — try current AWS credentials directly
    try {
      const identity = await getCallerIdentity(null);
      accountId = identity.accountId;
      region = process.env.AWS_DEFAULT_REGION ?? "us-east-1";
    } catch {
      ui.fail("No local config and no AWS credentials found.");
      ui.info("Configure AWS credentials and try again.");
      return;
    }
  }

  // Verify there are actually Gremlin stacks to destroy
  const tempConfig = config ?? {
    version: "0.0.1",
    aws: { region, accountId, stackPrefix: "Gremlin" },
  };
  const stacks = await findGremlinStacks(tempConfig);
  if (stacks.length === 0) {
    ui.info("No Gremlin stacks found in this account/region.");
    return;
  }

  // Refresh identity
  try {
    const identity = await getCallerIdentity(tempConfig);
    accountId = identity.accountId;
  } catch {
    // Use what we have
  }

  ui.blank();
  ui.log(
    chalk.red.bold(
      "⚠ This will permanently destroy your Gremlin installation.",
    ),
  );
  ui.blank();
  ui.info("Consider exporting your data first: gremlin export --out ./backup");
  ui.blank();
  ui.log("Resources to be deleted:");
  ui.blank();
  ui.log(`  AWS Infrastructure (${region}, account ${accountId}):`);
  ui.info(`  Stacks: ${stacks.join(", ")}`);
  ui.info("  - DynamoDB tables (all agent data, tasks, conversations)");
  ui.info("  - SQS queues");
  ui.info("  - EC2 sandbox instances");
  ui.info("  - CloudFront distribution");
  ui.info("  - IAM roles");

  if (config?.eventSources?.gmail) {
    ui.blank();
    ui.log(`  GCP Infrastructure (${config.eventSources.gmail.gcpProject}):`);
    ui.info(
      "  - Gmail event source (Cloud Function, Pub/Sub, service account, WIF)",
    );
  }

  ui.blank();
  ui.log(chalk.red("  This action cannot be undone."));
  ui.blank();

  ui.info("Tip: To remove just one part, use:");
  ui.info("  gremlin remove gmail");
  ui.info("  gremlin remove domain");
  ui.blank();

  const confirmation = await input({
    message: 'Type "destroy gremlin" to confirm:',
  });

  if (confirmation !== "destroy gremlin") {
    ui.info("Cancelled.");
    return;
  }

  ui.blank();
  ui.log("Destroying AWS infrastructure...");
  ui.blank();

  try {
    cdkDestroy({ profile, region });
  } catch {
    ui.blank();
    ui.fail("CDK destroy failed — some resources may remain");
    ui.info("Check the AWS console for leftover resources.");
    process.exit(1);
  }

  ui.blank();
  ui.success("Gremlin destroyed");
  ui.blank();
}
