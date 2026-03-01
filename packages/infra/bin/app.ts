#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AdminStack } from "../lib/admin-stack.js";
import { AuthStack } from "../lib/auth-stack.js";
import { DatabaseStack } from "../lib/database-stack.js";
import { MediaStack } from "../lib/media-stack.js";
import { ServerStack } from "../lib/server-stack.js";

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

// 1. Foundation — no dependencies
const db = new DatabaseStack(app, "GremlinDatabaseStack", { env });
const auth = new AuthStack(app, "GremlinAuthStack", { env });
const media = new MediaStack(app, "GremlinMediaStack", { env });

// 2. Server — depends on Database, Auth, Media
new ServerStack(app, "GremlinServerStack", {
  env,
  table: db.table,
  tableName: db.tableName,
  userPoolId: auth.userPoolId,
  userPoolClientId: auth.userPoolClientId,
  mediaCdnUrl: media.cdnUrl,
});

// 3. Admin — depends on Auth, Media
new AdminStack(app, "GremlinAdminStack", {
  env,
  userPoolId: auth.userPoolId,
  userPoolClientId: auth.userPoolClientId,
  cognitoDomain: auth.cognitoDomain,
  mediaCdnUrl: media.cdnUrl,
});
