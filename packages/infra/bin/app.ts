#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AdminStack } from "../lib/admin-stack.js";
import { AuthStack } from "../lib/auth-stack.js";
import { DatabaseStack } from "../lib/database-stack.js";
import { MediaStack } from "../lib/media-stack.js";
import { MessagingStack } from "../lib/messaging-stack.js";
import { PresetIamRolesStack } from "../lib/preset-iam-roles-stack.js";
import { SandboxEc2Stack } from "../lib/sandbox-ec2-stack.js";
import { ServerStack } from "../lib/server-stack.js";
import { VpcStack } from "../lib/vpc-stack.js";

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

// Optional context params for managed SaaS tenant deployments.
// When deploying via the account vending CodeBuild, these are passed as:
//   cdk deploy --all -c tenantId=abc123 -c controlPlaneApiUrl=https://api.opengremlin.com/v1
const tenantId = app.node.tryGetContext("tenantId") as string | undefined;
const controlPlaneApiUrl = app.node.tryGetContext("controlPlaneApiUrl") as
  | string
  | undefined;

// 0. Network — no dependencies
const network = new VpcStack(app, "GremlinVpcStack", { env });

// 1. Foundation — depends on VPC only
const db = new DatabaseStack(app, "GremlinDatabaseStack", {
  env,
  vpc: network.vpc,
});
const auth = new AuthStack(app, "GremlinAuthStack", {
  env,
  cognitoDomainPrefix: tenantId ? `gremlin-${tenantId}` : undefined,
});
const media = new MediaStack(app, "GremlinMediaStack", { env });

// 2. Server — depends on VPC, Database, Auth, Media
const server = new ServerStack(app, "GremlinServerStack", {
  env,
  vpc: network.vpc,
  table: db.table,
  tableName: db.tableName,
  chatTable: db.chatTable,
  chatTableName: db.chatTableName,
  secretsTable: db.secretsTable,
  secretsTableName: db.secretsTableName,
  fileSystem: db.fileSystem,
  accessPoint: db.accessPoint,
  userPoolId: auth.userPoolId,
  userPoolClientId: auth.userPoolClientId,
  cognitoDomain: auth.cognitoDomain,
  mediaBucket: media.bucket,
  mediaBucketName: media.bucketName,
  uploadsBucket: db.uploadsBucket,
  uploadsBucketName: db.uploadsBucketName,
  skillsBucket: db.skillsBucket,
  skillsBucketName: db.skillsBucketName,
  tenantId,
  controlPlaneApiUrl,
});

// 3. Messaging — depends on Database, Server
new MessagingStack(app, "GremlinMessagingStack", {
  env,
  serverRole: server.serverRole,
});

// 4. Sandbox EC2 — depends on VPC, Server (SG, notify hook role, EIP)
new SandboxEc2Stack(app, "GremlinSandboxEc2Stack", {
  env,
  vpc: network.vpc,
  serverSecurityGroup: server.serverSecurityGroup,
  fileSystem: db.fileSystem,
  accessPoint: db.accessPoint,
  table: db.table,
  tableName: db.tableName,
});

// 5. Preset IAM roles — depends on Server (for trust policy) and Database
//    (for the internal table ARNs that preset roles must be denied access to)
new PresetIamRolesStack(app, "GremlinPresetIamRolesStack", {
  env,
  serverRole: server.serverRole,
  internalTables: [db.table, db.chatTable, db.secretsTable],
});

// 6. Web app — depends on Auth, Media, Server (for ALB)
new AdminStack(app, "GremlinAdminStack", {
  env,
  userPoolId: auth.userPoolId,
  userPoolClientId: auth.userPoolClientId,
  cognitoDomain: auth.cognitoDomain,
  serverDns: server.serverDns,
});
