#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { GremlinStack } from "../lib/gremlin-stack";

const app = new cdk.App();

new GremlinStack(app, "GremlinStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
