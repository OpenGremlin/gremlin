import { cdkDeploy } from "../cdk.js";
import { loadConfig } from "../config.js";
import * as ui from "../ui.js";

export async function updateCommand(): Promise<void> {
  const config = loadConfig();
  if (!config?.aws) {
    ui.fail("Not initialized. Run: gremlin init");
    process.exit(1);
  }

  ui.heading("Updating Gremlin");
  ui.blank();

  ui.log("Updating AWS infrastructure...");
  ui.blank();

  try {
    await cdkDeploy({
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

  ui.blank();
  ui.success("Gremlin updated");
  ui.blank();
}
