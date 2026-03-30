/**
 * Seeds LocalStack DynamoDB with sample data for local development.
 * Run after create-local-tables.ts.
 *
 * Usage: LOCALSTACK_ENDPOINT=http://localhost:4566 tsx scripts/seed-local.ts
 *   or:  pnpm --filter @opengremlin/server run db:seed
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const endpoint = process.env.LOCALSTACK_ENDPOINT ?? "http://localhost:4566";
const client = new DynamoDBClient({ region: "us-east-1", endpoint });
const docClient = DynamoDBDocumentClient.from(client);
const TableName = "gremlin";

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

const agents = [
  {
    id: "clawd",
    name: "Clawd",
    avatar: "clawd",
    portraitId: "clawd",
    soul: "A helpful and creative assistant who loves writing and storytelling.",
  },
];

for (const agent of agents) {
  await docClient.send(
    new PutCommand({
      TableName,
      Item: {
        pk: "AGENT",
        sk: `AGENT#${agent.id}`,
        _et: "Agent",
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        portraitId: agent.portraitId,
        soul: agent.soul,
      },
    }),
  );
  console.log(`Agent: ${agent.name}`);
}

console.log("Done.");
