import { input } from "@inquirer/prompts";
import chalk from "chalk";
import { getCallerIdentity } from "../aws.js";
import { cdkDestroy } from "../cdk.js";
import { loadConfig } from "../config.js";
import * as ui from "../ui.js";

export async function destroyCommand(): Promise<void> {
  const config = loadConfig();
  if (!config?.aws) {
    ui.fail("Not initialized. Nothing to destroy.");
    return;
  }

  let accountId = config.aws.accountId;
  try {
    const identity = await getCallerIdentity(config);
    accountId = identity.accountId;
  } catch {
    // Use cached account ID
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
  ui.log(`  AWS Infrastructure (${config.aws.region}, account ${accountId}):`);
  ui.info("  - DynamoDB tables (all agent data, tasks, conversations)");
  ui.info("  - SQS queues");
  ui.info("  - EC2 sandbox instances");
  ui.info("  - CloudFront distribution");
  ui.info("  - IAM roles");

  if (config.eventSources?.gmail) {
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
    cdkDestroy({
      profile: config.aws.profile,
      region: config.aws.region,
    });
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
