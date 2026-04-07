import * as cdk from "aws-cdk-lib";
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

export interface PresetIamRolesStackProps extends cdk.StackProps {
  serverRole: iam.IRole;
  /**
   * Gremlin-internal DynamoDB tables that preset roles must NOT be able to
   * touch. An explicit Deny on these ARNs is added to every preset role so
   * that broad allows (e.g. `dynamodb:*` on `*`, or the managed
   * `ReadOnlyAccess` policy) can't be used to read or modify Gremlin's own
   * data — most importantly the secrets table.
   */
  internalTables: dynamodb.ITable[];
}

interface PresetRoleDef {
  id: string;
  name: string;
  description: string;
  statements: iam.PolicyStatementProps[];
}

const presetRoles: PresetRoleDef[] = [
  {
    id: "troubleshooting",
    name: "GremlinPresetTroubleshooting",
    description:
      "Read-only access to CloudWatch, EC2, ECS, and Lambda for troubleshooting",
    statements: [
      {
        actions: [
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "logs:GetQueryResults",
          "logs:StartQuery",
          "logs:StopQuery",
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:DescribeAlarms",
          "cloudwatch:GetDashboard",
          "cloudwatch:ListDashboards",
        ],
        resources: ["*"],
      },
      {
        actions: [
          "ec2:Describe*",
          "ecs:Describe*",
          "ecs:List*",
          "rds:Describe*",
          "rds:List*",
          "lambda:GetFunction",
          "lambda:ListFunctions",
          "lambda:GetFunctionConfiguration",
          "health:Describe*",
          "xray:GetTraceSummaries",
          "xray:BatchGetTraces",
          "xray:GetServiceGraph",
        ],
        resources: ["*"],
      },
    ],
  },
  {
    id: "database-admin",
    name: "GremlinPresetDatabaseAdmin",
    description: "Full DynamoDB and RDS access with CloudWatch monitoring",
    statements: [
      {
        actions: ["dynamodb:*"],
        resources: ["*"],
      },
      {
        actions: [
          "rds:Describe*",
          "rds:List*",
          "rds:ModifyDBInstance",
          "rds:ModifyDBCluster",
          "rds:CreateDBSnapshot",
          "rds:CreateDBClusterSnapshot",
        ],
        resources: ["*"],
      },
      {
        actions: [
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
        ],
        resources: ["*"],
      },
    ],
  },
  // Note: Lambda, API Gateway, and the iam:CreateRole/AttachRolePolicy/
  // PassRole-on-`gremlin-*` block are intentionally absent from `app-builder`.
  // The Gremlin agent itself is the runtime — customers don't deploy Lambdas
  // through this preset — and the IAM block existed only to support the
  // (now-removed) Lambda capability. Together it had a textbook escalation
  // path: create gremlin-* role, attach AdministratorAccess, pass to Lambda.
  // Don't add any of these back without re-reading that paragraph.
  {
    id: "app-builder",
    name: "GremlinPresetAppBuilder",
    description: "Create and manage DynamoDB, RDS/Aurora, and S3 resources",
    statements: [
      {
        actions: ["dynamodb:*"],
        resources: ["*"],
      },
      {
        actions: ["s3:*"],
        resources: ["*"],
      },
      {
        actions: ["rds:*"],
        resources: ["*"],
      },
      {
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "cloudwatch:GetMetricData",
          "cloudwatch:ListMetrics",
        ],
        resources: ["*"],
      },
    ],
  },
  {
    id: "read-only",
    name: "GremlinPresetReadOnly",
    description: "Broad read-only access across AWS services",
    statements: [],
  },
];

export class PresetIamRolesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PresetIamRolesStackProps) {
    super(scope, id, props);

    const internalTableArns = props.internalTables.flatMap((t) => [
      t.tableArn,
      `${t.tableArn}/index/*`,
      // Stream ARNs follow a different shape than index ARNs and aren't
      // matched by the patterns above. Streams aren't enabled on either
      // internal table today, but adding the pattern preemptively means
      // enabling streams later won't silently bypass the deny.
      `${t.tableArn}/stream/*`,
    ]);

    for (const preset of presetRoles) {
      const role = new iam.Role(this, preset.name, {
        roleName: preset.name,
        assumedBy: new iam.ArnPrincipal(props.serverRole.roleArn),
        description: preset.description,
      });

      if (preset.id === "read-only") {
        role.addManagedPolicy(
          iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess"),
        );
      } else {
        for (const stmt of preset.statements) {
          role.addToPolicy(new iam.PolicyStatement(stmt));
        }
      }

      // Explicit deny on Gremlin-internal tables. Deny beats every Allow,
      // including the managed ReadOnlyAccess policy attached to `read-only`
      // and the `dynamodb:*` allows on `database-admin` / `app-builder`.
      role.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ["dynamodb:*"],
          resources: internalTableArns,
        }),
      );

      // Tag-based catch-all: deny reads and writes against any resource
      // tagged `gremlin:internal=true`. Caveats:
      //   • Only applies to operations that target a specific resource the
      //     IAM evaluator can read tags from (Get/Put/Update/Delete style).
      //   • Does NOT constrain Create* (no resource yet) or most List*
      //     operations (no specific ARN). A preset role can still List
      //     internal resources in an account-wide listing — it just can't
      //     read or modify them.
      //   • Services without `aws:ResourceTag` support silently skip this,
      //     matching today's behavior, so there is no regression risk.
      // For future-proofing internal infra without touching this stack
      // again, tag the new construct with `gremlin:internal=true`.
      role.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ["*"],
          resources: ["*"],
          conditions: {
            StringEquals: { "aws:ResourceTag/gremlin:internal": "true" },
          },
        }),
      );

      new ssm.StringParameter(this, `${preset.name}ArnParam`, {
        parameterName: `/gremlin/preset-roles/${preset.id}`,
        stringValue: role.roleArn,
        description: preset.description,
      });
    }
  }
}
