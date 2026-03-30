import { confirm } from "@inquirer/prompts";
import { deleteSsmParam, getSsmParam } from "../aws.js";
import { cdkDeploy } from "../cdk.js";
import { loadConfig, saveConfig } from "../config.js";
import * as ui from "../ui.js";

export async function removeDomainCommand(): Promise<void> {
  const config = loadConfig();
  if (!config?.aws) {
    ui.fail("Not initialized. Run: gremlin init");
    process.exit(1);
  }

  const domain = await getSsmParam(config, "/gremlin/custom-domain");
  if (!domain) {
    ui.info("No custom domain configured.");
    return;
  }

  ui.blank();
  ui.log("This will:");
  ui.info("- Remove custom domain alias from CloudFront");
  ui.info("- Delete ACM certificate");
  ui.blank();

  const proceed = await confirm({
    message: "Proceed?",
    default: false,
  });
  if (!proceed) return;

  ui.blank();
  ui.log("Removing domain from SSM...");
  await deleteSsmParam(config, "/gremlin/custom-domain");
  ui.success("Domain removed from SSM");

  ui.blank();
  ui.log("Deploying CloudFront changes...");
  ui.blank();

  try {
    cdkDeploy({
      profile: config.aws.profile,
      region: config.aws.region,
    });
  } catch {
    ui.blank();
    ui.fail("CDK deploy failed");
    process.exit(1);
  }

  // Update local config
  delete config.domain;
  if (config.server) {
    // Revert to CloudFront URL — will be updated on next status check
    config.server.url = "https://cloudfront-url — run gremlin status";
  }
  saveConfig(config);

  ui.blank();
  ui.success("Custom domain removed");
  ui.blank();
  ui.info(`You can remove this DNS record:`);
  ui.info(`  ${domain} → your CloudFront distribution`);
  ui.blank();
}
