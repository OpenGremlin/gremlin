import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  ...(process.env.LOCALSTACK_ENDPOINT && {
    endpoint: process.env.LOCALSTACK_ENDPOINT,
  }),
});

export const documentClient = DynamoDBDocumentClient.from(ddbClient);
