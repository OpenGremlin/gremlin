#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AdminStack } from "../lib/admin-stack.js";
import { DatabaseStack } from "../lib/database-stack.js";
import { MediaStack } from "../lib/media-stack.js";
import { ServerStack } from "../lib/server-stack.js";

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

const db = new DatabaseStack(app, "GremlinDatabaseStack", { env });
const admin = new AdminStack(app, "GremlinAdminStack", { env });

new ServerStack(app, "GremlinServerStack", {
  env,
  tables: db.tables,
  tablePrefix: db.tablePrefix,
  userPoolId: admin.userPoolId,
  userPoolClientId: admin.userPoolClientId,
});

new MediaStack(app, "GremlinMediaStack", { env });
