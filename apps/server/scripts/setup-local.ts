import {
  CreateTableCommand,
  DynamoDBClient,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";
import {
  CreateScheduleGroupCommand,
  SchedulerClient,
} from "@aws-sdk/client-scheduler";
import { CreateQueueCommand, SQSClient } from "@aws-sdk/client-sqs";

const endpoint = process.env.LOCALSTACK_ENDPOINT ?? "http://localhost:4566";
const region = "us-east-1";

const ddb = new DynamoDBClient({ region, endpoint });
const sqs = new SQSClient({ region, endpoint });
const scheduler = new SchedulerClient({ region, endpoint });

// --- DynamoDB tables ---

async function createTable(
  params: ConstructorParameters<typeof CreateTableCommand>[0],
) {
  try {
    await ddb.send(new CreateTableCommand(params));
    console.log(`Created table: ${params.TableName}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`Table already exists: ${params.TableName}`);
    } else {
      throw err;
    }
  }
}

await createTable({
  TableName: "gremlin",
  KeySchema: [
    { AttributeName: "pk", KeyType: "HASH" },
    { AttributeName: "sk", KeyType: "RANGE" },
  ],
  AttributeDefinitions: [
    { AttributeName: "pk", AttributeType: "S" },
    { AttributeName: "sk", AttributeType: "S" },
    { AttributeName: "gsi1pk", AttributeType: "S" },
    { AttributeName: "gsi1sk", AttributeType: "S" },
    { AttributeName: "gsi2pk", AttributeType: "S" },
    { AttributeName: "gsi2sk", AttributeType: "S" },
    { AttributeName: "gsi3pk", AttributeType: "S" },
    { AttributeName: "gsi3sk", AttributeType: "S" },
    { AttributeName: "gsi4pk", AttributeType: "S" },
    { AttributeName: "gsi4sk", AttributeType: "S" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "gsi1",
      KeySchema: [
        { AttributeName: "gsi1pk", KeyType: "HASH" },
        { AttributeName: "gsi1sk", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
    {
      IndexName: "gsi2",
      KeySchema: [
        { AttributeName: "gsi2pk", KeyType: "HASH" },
        { AttributeName: "gsi2sk", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
    {
      IndexName: "gsi3",
      KeySchema: [
        { AttributeName: "gsi3pk", KeyType: "HASH" },
        { AttributeName: "gsi3sk", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
    {
      IndexName: "gsi4",
      KeySchema: [
        { AttributeName: "gsi4pk", KeyType: "HASH" },
        { AttributeName: "gsi4sk", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
});

await createTable({
  TableName: "gremlin-secrets",
  KeySchema: [
    { AttributeName: "pk", KeyType: "HASH" },
    { AttributeName: "sk", KeyType: "RANGE" },
  ],
  AttributeDefinitions: [
    { AttributeName: "pk", AttributeType: "S" },
    { AttributeName: "sk", AttributeType: "S" },
  ],
  BillingMode: "PAY_PER_REQUEST",
});

// --- SQS queue ---

try {
  const res = await sqs.send(
    new CreateQueueCommand({ QueueName: "gremlin-doorbell" }),
  );
  console.log(`Created SQS queue: ${res.QueueUrl}`);
} catch (err: unknown) {
  if (err instanceof Error && err.name === "QueueNameExists") {
    console.log("SQS queue already exists: gremlin-doorbell");
  } else {
    throw err;
  }
}

// --- EventBridge Scheduler group ---

try {
  await scheduler.send(new CreateScheduleGroupCommand({ Name: "gremlin" }));
  console.log("Created scheduler group: gremlin");
} catch (err: unknown) {
  if (err instanceof Error && err.name === "ConflictException") {
    console.log("Scheduler group already exists: gremlin");
  } else {
    throw err;
  }
}

console.log("Done.");
