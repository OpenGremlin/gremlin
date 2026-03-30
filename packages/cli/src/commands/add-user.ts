import { input, password } from "@inquirer/prompts";
import { createAdminUser, getStackOutputs } from "../aws.js";
import { loadConfig } from "../config.js";
import * as ui from "../ui.js";

export async function addUserCommand(): Promise<void> {
  const config = loadConfig();
  if (!config?.aws) {
    ui.fail("Not initialized. Run: gremlin init");
    process.exit(1);
  }

  const authOutputs = await getStackOutputs(config, "GremlinAuthStack");
  const userPoolId = authOutputs?.UserPoolId;

  if (!userPoolId) {
    ui.fail("Could not read UserPoolId from GremlinAuthStack");
    process.exit(1);
  }

  const email = await input({ message: "Email:" });
  const pw = await password({ message: "Password:", mask: "*" });

  if (!email || !pw) {
    ui.fail("Email and password are required");
    process.exit(1);
  }

  const confirmPw = await password({ message: "Confirm password:", mask: "*" });

  if (pw !== confirmPw) {
    ui.fail("Passwords do not match");
    process.exit(1);
  }

  try {
    await createAdminUser(config, userPoolId, email, pw);
    ui.blank();
    ui.success(`Admin user created: ${email}`);
    ui.blank();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UsernameExistsException")) {
      ui.fail("User already exists");
    } else {
      ui.fail(`Could not create user: ${msg}`);
    }
    process.exit(1);
  }
}
