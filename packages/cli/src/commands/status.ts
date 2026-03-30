import chalk from "chalk";
import { findGremlinStacks, getCallerIdentity, getSsmParam } from "../aws.js";
import { loadConfig } from "../config.js";
import * as ui from "../ui.js";

export async function statusCommand(): Promise<void> {
  const config = loadConfig();

  ui.heading("Gremlin");
  ui.blank();

  if (!config?.aws) {
    ui.fail("Not initialized. Run: gremlin init");
    return;
  }

  // AWS identity
  try {
    const identity = await getCallerIdentity(config);
    ui.table([
      [
        "AWS Infrastructure",
        chalk.green("✓"),
        `${config.aws.region} (account ${identity.accountId})`,
      ],
    ]);
  } catch {
    ui.table([
      [
        "AWS Infrastructure",
        chalk.red("✗"),
        "cannot connect — check credentials",
      ],
    ]);
    return;
  }

  // Server URL
  const adminUrl = await getSsmParam(config, "/gremlin/admin-url");
  if (adminUrl) {
    ui.table([["Server", chalk.green("✓"), adminUrl]]);
  } else {
    ui.table([["Server", chalk.red("✗"), "not deployed"]]);
  }

  // Custom domain
  const domain = await getSsmParam(config, "/gremlin/custom-domain");
  if (domain) {
    ui.table([["Custom domain", chalk.green("✓"), domain]]);
  } else {
    ui.table([["Custom domain", chalk.dim("—"), "run: gremlin setup domain"]]);
  }

  // Stacks
  const stacks = await findGremlinStacks(config);
  if (stacks.length > 0) {
    ui.blank();
    ui.info(chalk.dim(`Stacks: ${stacks.join(", ")}`));
  }

  ui.blank();
  ui.link("Docs", "https://opengremlin.com/docs");
  ui.blank();
}
