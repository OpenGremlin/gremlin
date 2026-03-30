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
  ui.warn(
    "Lambda@Edge functions (used for file auth) can take 30-60 minutes to",
  );
  ui.info(
    "fully replicate-delete after CloudFront is removed. If the AdminStack",
  );
  ui.info(
    "fails to delete, wait and retry, or delete it from the CloudFormation",
  );
  ui.info('console with "Retain" selected for the Lambda function.');
  ui.link(
    "More info",
    "https://opengremlin.com/docs/troubleshooting/lambda-edge-delete",
  );
  ui.blank();

  ui.log("Destroying stacks in dependency order...");
  ui.blank();

  const { destroyed, failed } = cdkDestroy({ profile, region, stacks });

  ui.blank();
  if (destroyed.length > 0) {
    for (const s of destroyed) {
      ui.success(s);
    }
  }
  if (failed.length > 0) {
    for (const s of failed) {
      ui.fail(s);
    }
  }
  ui.blank();

  if (failed.length > 0) {
    ui.warn(`${failed.length} stack(s) failed to delete`);
    ui.blank();
    ui.info("You can retry with: pnpm gremlin -- destroy");
    ui.info("Or delete from the AWS CloudFormation console.");
    ui.blank();
    if (failed.includes("GremlinAdminStack")) {
      ui.info("GremlinAdminStack is likely stuck due to Lambda@Edge:");
      ui.info("  1. Wait 30-60 minutes for edge replicas to clean up");
      ui.info('  2. Delete the stack with "Retain" for the Lambda function');
      ui.info("  3. Re-run destroy to clean up remaining stacks");
      ui.blank();
    }
    process.exit(1);
  }

  ui.success("Gremlin destroyed");
  ui.blank();
}
