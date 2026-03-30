import { confirm, input } from "@inquirer/prompts";
import chalk from "chalk";
import { getSsmParam, putSsmParam } from "../aws.js";
import { cdkDeploy } from "../cdk.js";
import { loadConfig, saveConfig } from "../config.js";
import * as ui from "../ui.js";

export async function setupDomainCommand(): Promise<void> {
  const config = loadConfig();
  if (!config?.aws) {
    ui.fail("Not initialized. Run: gremlin init");
    process.exit(1);
  }

  // Check if already configured
  const existing = await getSsmParam(config, "/gremlin/custom-domain");
  if (existing) {
    ui.blank();
    ui.log(`Custom domain already configured: ${chalk.bold(existing)}`);
    ui.blank();
    const change = await confirm({
      message: "Change domain?",
      default: false,
    });
    if (!change) return;
  }

  const domain = await input({ message: "Domain name:" });
  if (!domain) {
    ui.fail("Domain name is required");
    process.exit(1);
  }

  ui.blank();
  ui.info("Note: CloudFront certificates must be in us-east-1.");
  if (config.aws.region !== "us-east-1") {
    ui.info(`Your other infrastructure stays in ${config.aws.region}.`);
  }
  ui.blank();

  ui.log("Writing domain to SSM...");
  await putSsmParam(config, "/gremlin/custom-domain", domain);
  ui.success("Domain stored in SSM");

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
    ui.link(
      "Troubleshooting",
      "https://opengremlin.com/docs/troubleshooting/deploy",
    );
    process.exit(1);
  }

  // Update local config
  config.domain = domain;
  config.server = { url: `https://${domain}` };
  saveConfig(config);

  ui.blank();
  ui.success(`Gremlin is now at https://${domain}`);
  ui.blank();
  ui.info("If you haven't already, add a CNAME record in your DNS:");
  ui.info(`  ${domain} → your CloudFront distribution domain`);
  ui.blank();
  ui.link("DNS setup", "https://opengremlin.com/docs/setup/custom-domain#dns");
  ui.blank();
}
