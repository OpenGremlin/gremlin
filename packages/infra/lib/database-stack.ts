import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";

export class DatabaseStack extends cdk.Stack {
  readonly table: dynamodb.ITable;
  readonly tableName: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.tableName = "gremlin";

    const table = new dynamodb.Table(this, "Table", {
      tableName: this.tableName,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.table = table;

    // Temporary: keep old exports alive so ServerStack can deploy without them
    // Remove these after ServerStack is deployed with the new single-table ref
    const oldTableNames = [
      ["FeedItemsTableBE2A0FA4", "F5D22F97"],
      ["AgentJobsTableD1DBDD6A", "338FA6E9"],
      ["IntegrationsTable781EC78A", "7A867032"],
      ["SkillsTable9B10D7DD", "F0876994"],
    ];
    for (const [tableId, suffix] of oldTableNames) {
      new cdk.CfnOutput(this, `LegacyExport${tableId}`, {
        value: table.tableArn,
        exportName: `GremlinDatabaseStack:ExportsOutputFnGetAtt${tableId}Arn${suffix}`,
      });
    }
  }
}
