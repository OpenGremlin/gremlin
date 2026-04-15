import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { PostItem } from "../../resources/ddb/schema/post.js";
import type { ServiceContext } from "../context.js";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generatePostId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += CHARS[bytes[i] % CHARS.length];
  }
  return id;
}

/**
 * Collect attachment IDs from a task and its children.
 * Queries TaskAttachment GSI1 for each task, deduplicates by ID.
 */
async function collectAttachmentIds(
  ctx: ServiceContext,
  taskId: string,
): Promise<string[]> {
  const table = ctx.resources.ddb.chatTable;
  const tableName = table.getName();
  const docClient = table.getDocumentClient();

  const taskIds = [taskId];

  // Gather children
  const children = await ctx.services.tasks.getChildren(ctx, taskId);
  for (const child of children) {
    taskIds.push(child.id);
  }

  // Query attachment IDs for all tasks in parallel
  const results = await Promise.all(
    taskIds.map(async (tid) => {
      const { Items } = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "gsi1",
          KeyConditionExpression: "gsi1pk = :pk",
          ExpressionAttributeValues: {
            ":pk": `TASK_ATTACHMENT#${tid}`,
          },
          ProjectionExpression: "id",
        }),
      );
      return (Items ?? []).map((i) => (i as { id: string }).id);
    }),
  );

  // Flatten and deduplicate
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const batch of results) {
    for (const id of batch) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }

  return ids;
}

/**
 * Check if a post already exists for a given taskId.
 * Uses GSI2 (POST_ALL) with a filter — acceptable because this is a
 * guard against rare duplicates, not a hot path.
 */
async function postExistsForTask(
  ctx: ServiceContext,
  taskId: string,
): Promise<boolean> {
  const table = ctx.resources.ddb.chatTable;
  const { Items } = await table.getDocumentClient().send(
    new QueryCommand({
      TableName: table.getName(),
      IndexName: "gsi2",
      KeyConditionExpression: "gsi2pk = :pk",
      FilterExpression: "taskId = :taskId",
      ExpressionAttributeValues: {
        ":pk": "POST_ALL",
        ":taskId": taskId,
      },
      Limit: 1,
    }),
  );
  return (Items ?? []).length > 0;
}

export async function createPost(
  ctx: ServiceContext,
  input: {
    agentId: string;
    taskId: string;
    title: string;
    message: string;
  },
): Promise<PostItem> {
  // Guard: don't create duplicate posts for the same task
  if (await postExistsForTask(ctx, input.taskId)) {
    ctx.log.info(
      { taskId: input.taskId },
      "Post already exists for task, skipping",
    );
    // Return a stub so the tool call doesn't error
    return {
      id: "",
      agentId: input.agentId,
      taskId: input.taskId,
      title: input.title,
      message: input.message,
      attachmentIds: [],
      createdAt: new Date().toISOString(),
    };
  }

  const now = new Date().toISOString();
  const id = generatePostId();

  // Collect attachment IDs from the task tree
  const attachmentIds = await collectAttachmentIds(ctx, input.taskId);

  const item: PostItem = {
    id,
    agentId: input.agentId,
    taskId: input.taskId,
    title: input.title,
    message: input.message,
    attachmentIds,
    createdAt: now,
  };

  const table = ctx.resources.ddb.chatTable;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...item,
        _et: "Post",
        pk: `POST#${id}`,
        sk: "POST",
        // GSI1: query posts by agent
        gsi1pk: `POST_AGENT#${input.agentId}`,
        gsi1sk: now,
        // GSI2: query all posts chronologically
        gsi2pk: "POST_ALL",
        gsi2sk: `${now}#${id}`,
      },
    }),
  );

  ctx.resources.pubsub.publish("postCreated", item);

  ctx.log.info(
    { postId: id, taskId: input.taskId, attachmentCount: attachmentIds.length },
    "Created post from task completion",
  );

  return item;
}
