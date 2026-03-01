import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});
const docClient = DynamoDBDocumentClient.from(client);
const TableName = process.env.DYNAMODB_TABLE_NAME || "gremlin";
const AGENT_ID = "clawd";

const notifications = [
  {
    id: "notif-001",
    type: "PERMISSION",
    turnId: "turn-abc-001",
    message:
      "I need access to the repos:write scope on GitHub to create a pull request for the Q1 marketing brief.",
    actions: [
      { id: "grant", label: "Grant access", style: "primary" },
      { id: "deny", label: "Deny", style: "secondary" },
    ],
    status: "PENDING",
    resolvedAction: null,
    createdAt: "2026-03-01T10:15:00.000Z",
  },
  {
    id: "notif-002",
    type: "PERMISSION",
    turnId: "turn-abc-002",
    message:
      "The Slack integration needs the channels:write permission to post the weekly metrics report to #team-updates.",
    actions: [
      { id: "grant", label: "Enable permission", style: "primary" },
      { id: "deny", label: "Deny", style: "secondary" },
    ],
    status: "RESOLVED",
    resolvedAction: "grant",
    createdAt: "2026-02-28T09:00:00.000Z",
  },
  {
    id: "notif-003",
    type: "APPROVAL",
    turnId: "turn-abc-003",
    message:
      "I've drafted the Q1 marketing brief. Should I send it to the team mailing list or save it as a document?",
    actions: [
      { id: "send", label: "Send to team", style: "primary" },
      { id: "save", label: "Save as document", style: "secondary" },
    ],
    status: "PENDING",
    resolvedAction: null,
    createdAt: "2026-03-01T08:45:00.000Z",
  },
  {
    id: "notif-004",
    type: "APPROVAL",
    turnId: "turn-abc-004",
    message:
      "The competitor pricing report is ready. It includes 12 competitors across 3 tiers. Okay to finalize?",
    actions: [
      { id: "approve", label: "Looks good", style: "primary" },
      { id: "revise", label: "Let me review first", style: "secondary" },
    ],
    status: "DISMISSED",
    resolvedAction: null,
    createdAt: "2026-02-27T16:30:00.000Z",
  },
];

async function seed() {
  // Clear existing notifications
  console.log("Clearing existing notifications...");
  const { Items } = await docClient.send(
    new QueryCommand({
      TableName,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": "NOTIFICATION" },
    }),
  );
  for (const item of Items ?? []) {
    await docClient.send(
      new DeleteCommand({ TableName, Key: { pk: item.pk, sk: item.sk } }),
    );
    console.log(`  ✗ deleted ${item.sk}`);
  }

  console.log(
    `Seeding ${notifications.length} mock notifications for agent "${AGENT_ID}"...`,
  );

  for (const notif of notifications) {
    await docClient.send(
      new PutCommand({
        TableName,
        Item: {
          pk: "NOTIFICATION",
          sk: `NOTIFICATION#${notif.id}`,
          _et: "Notification",
          gsi1pk: `NOTIF_STATUS#${notif.status}`,
          gsi1sk: notif.createdAt,
          id: notif.id,
          agentId: AGENT_ID,
          type: notif.type,
          turnId: notif.turnId,
          message: notif.message,
          actions: notif.actions,
          status: notif.status,
          resolvedAction: notif.resolvedAction,
          createdAt: notif.createdAt,
        },
      }),
    );

    console.log(
      `  ✓ ${notif.id} — [${notif.type}] ${notif.status} — "${notif.message.slice(0, 50)}..."`,
    );
  }

  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
