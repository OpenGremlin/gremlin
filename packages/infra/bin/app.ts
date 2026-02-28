#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AdminStack } from "../lib/admin-stack.js";
import { DatabaseStack } from "../lib/database-stack.js";
import { ServerStack } from "../lib/server-stack.js";

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

const db = new DatabaseStack(app, "GremlinDatabaseStack", { env });

new ServerStack(app, "GremlinServerStack", {
  env,
  tables: db.tables,
  tablePrefix: db.tablePrefix,
});

new AdminStack(app, "GremlinAdminStack", { env });
