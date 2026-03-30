#!/usr/bin/env node
import { Command } from "commander";
import { addUserCommand } from "./commands/add-user.js";
import { destroyCommand } from "./commands/destroy.js";
import { initCommand } from "./commands/init.js";
import { removeDomainCommand } from "./commands/remove-domain.js";
import { setupDomainCommand } from "./commands/setup-domain.js";
import { statusCommand } from "./commands/status.js";
import { updateCommand } from "./commands/update.js";

const program = new Command();

program
  .name("gremlin")
  .description("Set up and manage your Gremlin installation")
  .version("0.0.1");

program
  .command("init")
  .description("First-run setup: AWS infra + admin account")
  .action(initCommand);

program
  .command("status")
  .description("Show what's configured and what's not")
  .action(statusCommand);

program
  .command("update")
  .description("Update deployment after pulling new repo version")
  .action(updateCommand);

program
  .command("destroy")
  .description("Tear down everything (requires confirmation)")
  .action(destroyCommand);

program
  .command("add-user")
  .description("Create an admin user in Cognito")
  .action(addUserCommand);

// ── setup subcommands ──────────────────────────────────────

const setup = program.command("setup").description("Add optional features");

setup
  .command("domain")
  .description("Add a custom domain with HTTPS")
  .action(setupDomainCommand);

// ── remove subcommands ─────────────────────────────────────

const remove = program
  .command("remove")
  .description("Remove optional features");

remove
  .command("domain")
  .description("Remove custom domain")
  .action(removeDomainCommand);

program.action(() => {
  program.help();
});

program.parse();
