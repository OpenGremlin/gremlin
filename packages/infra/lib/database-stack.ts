import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";

const TABLE_NAMES = [
  "feed-items",
  "agent-jobs",
  "integrations",
  "skills",
] as const;

export class DatabaseStack extends cdk.Stack {
  readonly tables: dynamodb.ITable[];
  readonly tablePrefix: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.tablePrefix = "gremlin-";

    this.tables = TABLE_NAMES.map((name) => {
      const pascalId = name
        .split("-")
        .map((s) => s[0].toUpperCase() + s.slice(1))
        .join("");
      return new dynamodb.Table(this, `${pascalId}Table`, {
        tableName: `${this.tablePrefix}${name}`,
        partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    });
  }
}
