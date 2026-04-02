import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

export interface PresetIamRolesStackProps extends cdk.StackProps {
  serverRole: iam.IRole;
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
  {
    id: "app-builder",
    name: "GremlinPresetAppBuilder",
    description:
      "Create and manage DynamoDB, RDS/Aurora, S3, Lambda, and API Gateway resources",
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
        actions: ["lambda:*"],
        resources: ["*"],
      },
      {
        actions: ["apigateway:*"],
        resources: ["*"],
      },
      {
        actions: ["rds:*"],
        resources: ["*"],
      },
      {
        actions: [
          "iam:PassRole",
          "iam:CreateRole",
          "iam:AttachRolePolicy",
          "iam:PutRolePolicy",
        ],
        resources: ["arn:aws:iam::*:role/gremlin-*"],
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

      new ssm.StringParameter(this, `${preset.name}ArnParam`, {
        parameterName: `/gremlin/preset-roles/${preset.id}`,
        stringValue: role.roleArn,
        description: preset.description,
      });
    }
  }
}
