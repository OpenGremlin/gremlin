import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
});
const docClient = DynamoDBDocumentClient.from(client);
const TableName = process.env.DYNAMODB_TABLE_NAME || "gremlin";
const AGENT_ID = "clawd";

const tasks = [
  {
    id: "task-001",
    title: "Summarize latest product reviews",
    status: "COMPLETED",
    statusReason: null,
    completedAt: "2026-02-28T14:30:00.000Z",
    originJobId: null,
    artifacts: ["doc:review-summary-001"],
  },
  {
    id: "task-002",
    title: "Draft Q1 marketing brief",
    status: "RUNNING",
    statusReason: null,
    completedAt: null,
    originJobId: null,
    artifacts: [],
  },
  {
    id: "task-003",
    title: "Research competitor pricing strategies",
    status: "PENDING",
    statusReason: null,
    completedAt: null,
    originJobId: null,
    artifacts: [],
  },
  {
    id: "task-004",
    title: "Generate weekly metrics report",
    status: "FAILED",
    statusReason: "Data source unavailable",
    completedAt: "2026-02-27T09:15:00.000Z",
    originJobId: null,
    artifacts: [],
  },
  {
    id: "task-005",
    title: "Compile onboarding checklist for new hires",
    status: "COMPLETED",
    statusReason: null,
    completedAt: "2026-02-26T11:00:00.000Z",
    originJobId: null,
    artifacts: ["doc:onboarding-checklist-001", "doc:onboarding-faq-001"],
  },
];

async function seed() {
  console.log(`Seeding ${tasks.length} mock tasks for agent "${AGENT_ID}"...`);

  for (const task of tasks) {
    const now = new Date().toISOString();
    const createdAt = task.completedAt ?? now;

    await docClient.send(
      new PutCommand({
        TableName,
        Item: {
          pk: "TASK",
          sk: `TASK#${task.id}`,
          _et: "Task",
          gsi1pk: `TASK_AGENT#${AGENT_ID}`,
          gsi1sk: createdAt,
          id: task.id,
          agentId: AGENT_ID,
          title: task.title,
          status: task.status,
          statusReason: task.statusReason,
          createdAt,
          updatedAt: now,
          completedAt: task.completedAt,
          originJobId: task.originJobId,
          artifacts: task.artifacts,
        },
      }),
    );

    console.log(`  ✓ ${task.id} — "${task.title}" [${task.status}]`);
  }

  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
