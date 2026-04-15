import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { PostItem } from "../../resources/ddb/schema/post.js";
import type { ServiceContext } from "../context.js";
import type { Attachment } from "../tasks/attachment.js";

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
 * Collect all attachments from a task and its children (if any).
 * Returns a flat array of attachments, children first then parent.
 */
async function collectTaskAttachments(
  ctx: ServiceContext,
  taskId: string,
): Promise<Attachment[]> {
  const children = await ctx.services.tasks.getChildren(ctx, taskId);
  const allAttachments: Attachment[] = [];

  // Collect from children first
  for (const child of children) {
    const childAttachments = await ctx.services.tasks.getTaskAttachments(
      ctx,
      child.id,
    );
    allAttachments.push(...childAttachments);
  }

  // Then from the parent/standalone task itself
  const taskAttachments = await ctx.services.tasks.getTaskAttachments(
    ctx,
    taskId,
  );
  allAttachments.push(...taskAttachments);

  return allAttachments;
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
  const now = new Date().toISOString();
  const id = `${now}#${generatePostId()}`;

  const item: PostItem = {
    id,
    agentId: input.agentId,
    taskId: input.taskId,
    title: input.title,
    message: input.message,
    createdAt: now,
  };

  // Collect attachments from the task tree
  const attachments = await collectTaskAttachments(ctx, input.taskId);

  // Write post
  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...item,
        _et: "Post",
        pk: "POST",
        sk: `POST#${id}`,
        // GSI1: query posts by agent
        gsi1pk: `POST_AGENT#${input.agentId}`,
        gsi1sk: now,
        // GSI2: query all posts chronologically
        gsi2pk: "POST_ALL",
        gsi2sk: `${now}#${id}`,
      },
    }),
  );

  // Write attachments as PostAttachment records
  for (const attachment of attachments) {
    const attId = crypto.randomUUID();
    await table.getDocumentClient().send(
      new PutCommand({
        TableName: table.getName(),
        Item: {
          _et: "PostAttachment",
          pk: "POST_ATTACHMENT",
          sk: `POST_ATTACHMENT#${attId}`,
          id: attId,
          postId: id,
          type: attachment.type,
          ...(attachment.type === "file" && { path: attachment.path }),
          ...(attachment.type === "link" && {
            url: attachment.url,
            ...(attachment.title != null && { title: attachment.title }),
            ...(attachment.description != null && {
              description: attachment.description,
            }),
          }),
          createdAt: now,
          // GSI1: query by post
          gsi1pk: `POST_ATTACHMENT#${id}`,
          gsi1sk: now,
        },
      }),
    );
  }

  ctx.resources.pubsub.publish("postCreated", item);

  ctx.log.info(
    { postId: id, taskId: input.taskId, attachmentCount: attachments.length },
    "Created post from task completion",
  );

  return item;
}
