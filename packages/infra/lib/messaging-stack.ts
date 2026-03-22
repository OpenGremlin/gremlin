import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";

export interface MessagingStackProps extends cdk.StackProps {
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

    // EventBridge rule: stale inbox renotifier every 3 minutes
    new events.Rule(this, "StaleRenotifierRule", {
      schedule: events.Schedule.rate(cdk.Duration.minutes(3)),
      targets: [
        new targets.SqsQueue(queue, {
          message: events.RuleTargetInput.fromObject({
            type: "stale_renotify",
            payload: {},
          }),
        }),
      ],
    });

    // EventBridge rule: daily core memory review (8 AM UTC = midnight PST)
    new events.Rule(this, "CoreMemoryReviewRule", {
      schedule: events.Schedule.cron({ hour: "8", minute: "0" }),
      targets: [
        new targets.SqsQueue(queue, {
          message: events.RuleTargetInput.fromObject({
            type: "core_memory_review",
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

    // Role that EventBridge Scheduler assumes to send messages to the queue
    const schedulerRole = new iam.Role(this, "SchedulerRole", {
      assumedBy: new iam.ServicePrincipal("scheduler.amazonaws.com"),
    });
    queue.grantSendMessages(schedulerRole);

    // Store scheduler role ARN and target queue ARN in SSM
    new cdk.aws_ssm.StringParameter(this, "ScheduleTargetArnParam", {
      parameterName: "/gremlin/schedule-target-queue-arn",
      stringValue: queue.queueArn,
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
