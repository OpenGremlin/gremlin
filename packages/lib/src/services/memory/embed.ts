import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

const MODEL_ID = "amazon.titan-embed-text-v2:0";
const DIMENSIONS = 1024;

export async function embed(text: string): Promise<number[]> {
  const response = await client.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: text,
        dimensions: DIMENSIONS,
      }),
    }),
  );

  const body = JSON.parse(new TextDecoder().decode(response.body));
  return body.embedding as number[];
}
