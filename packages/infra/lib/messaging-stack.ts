import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export interface MessagingStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
  tableName: string;
  serverRole: iam.IRole;
}

export class MessagingStack extends cdk.Stack {
  readonly queueUrl: string;
  readonly queueArn: string;

  constructor(scope: Construct, id: string, props: MessagingStackProps) {
    super(scope, id, props);

    // ── EventBridge Scheduler group ────────────────────────
    new cdk.aws_scheduler.CfnScheduleGroup(this, "SchedulerGroup", {
      name: "gremlin",
    });

    // ── SQS doorbell queue ──────────────────────────────────
    const dlq = new sqs.Queue(this, "DoorbellDlq", {
      queueName: "gremlin-doorbell-dlq",
      retentionPeriod: cdk.Duration.days(14),
    });

    const queue = new sqs.Queue(this, "DoorbellQueue", {
      queueName: "gremlin-doorbell",
      visibilityTimeout: cdk.Duration.seconds(30),
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
    });

    // Grant the ECS server permission to send + receive doorbells
    queue.grantSendMessages(props.serverRole);
    queue.grantConsumeMessages(props.serverRole);

    // ── Schedule target Lambda ──────────────────────────────
    // EventBridge Scheduler fires this Lambda for cron jobs and
    // delayed follow-ups. It writes to the inbox and rings the doorbell.
    const scheduleTargetFn = new nodejs.NodejsFunction(
      this,
      "ScheduleTargetFn",
      {
        entry: path.join(
          REPO_ROOT,
          "packages/functions/src/scheduleTarget.ts",
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 256,
        timeout: cdk.Duration.seconds(15),
        environment: {
          TABLE_NAME: props.tableName,
          QUEUE_URL: queue.queueUrl,
        },
      },
    );

    props.table.grantReadWriteData(scheduleTargetFn);
    queue.grantSendMessages(scheduleTargetFn);

    // Grant EventBridge Scheduler permission to invoke this Lambda
    scheduleTargetFn.addPermission("AllowSchedulerInvoke", {
      principal: new iam.ServicePrincipal("scheduler.amazonaws.com"),
      action: "lambda:InvokeFunction",
    });

    // ── Sweeper Lambda ──────────────────────────────────────
    // Runs every 3 minutes, queries GSI2 for stale unread inbox items,
    // and re-rings doorbells for agents with stuck work.
    const sweeperFn = new nodejs.NodejsFunction(this, "SweeperFn", {
      entry: path.join(REPO_ROOT, "packages/functions/src/sweeper.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: props.tableName,
        QUEUE_URL: queue.queueUrl,
      },
    });

    props.table.grantReadData(sweeperFn);
    queue.grantSendMessages(sweeperFn);

    // EventBridge rule: run sweeper every 3 minutes
    new events.Rule(this, "SweeperRule", {
      schedule: events.Schedule.rate(cdk.Duration.minutes(3)),
      targets: [new targets.LambdaFunction(sweeperFn)],
    });

    // EventBridge rule: daily core memory review (8 AM UTC = midnight PST)
    new events.Rule(this, "CoreMemoryReviewRule", {
      schedule: events.Schedule.cron({ hour: "8", minute: "0" }),
      targets: [
        new targets.LambdaFunction(scheduleTargetFn, {
          event: events.RuleTargetInput.fromObject({
            type: "core_memory_review",
            agentId: "clawd",
            payload: {},
          }),
        }),
      ],
    });

    // Store queue URL in SSM so the server can read it at boot
    new cdk.CfnOutput(this, "QueueUrl", { value: queue.queueUrl });

    // Grant server permission to create/delete EventBridge schedules
    props.serverRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "scheduler:CreateSchedule",
          "scheduler:DeleteSchedule",
          "scheduler:GetSchedule",
        ],
        resources: [
          `arn:aws:scheduler:${this.region}:${this.account}:schedule/gremlin/*`,
        ],
      }),
    );

    // Role that EventBridge Scheduler assumes to invoke the target Lambda
    const schedulerRole = new iam.Role(this, "SchedulerRole", {
      assumedBy: new iam.ServicePrincipal("scheduler.amazonaws.com"),
    });
    scheduleTargetFn.grantInvoke(schedulerRole);

    // Store scheduler role ARN and target Lambda ARN in SSM
    new cdk.aws_ssm.StringParameter(this, "ScheduleTargetArnParam", {
      parameterName: "/gremlin/schedule-target-lambda-arn",
      stringValue: scheduleTargetFn.functionArn,
    });

    new cdk.aws_ssm.StringParameter(this, "SchedulerRoleArnParam", {
      parameterName: "/gremlin/scheduler-role-arn",
      stringValue: schedulerRole.roleArn,
    });

    new cdk.aws_ssm.StringParameter(this, "QueueUrlParam", {
      parameterName: "/gremlin/doorbell-queue-url",
      stringValue: queue.queueUrl,
    });

    // Grant server permission to pass the scheduler role
    props.serverRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["iam:PassRole"],
        resources: [schedulerRole.roleArn],
      }),
    );

    this.queueUrl = queue.queueUrl;
    this.queueArn = queue.queueArn;
  }
}
