import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";
import type { Attachment } from "../tasks/attachment.js";

interface RawAttachmentItem {
  type: string;
  path?: string;
  url?: string;
  title?: string;
  description?: string;
}

function toAttachment(item: RawAttachmentItem): Attachment {
  if (item.type === "file" && item.path) {
    return { type: "file", path: item.path };
  }
  return {
    type: "link",
    url: item.url ?? "",
    ...(item.title != null && { title: item.title }),
    ...(item.description != null && { description: item.description }),
  };
}

/** Get all attachments for a post via GSI1. */
export async function getPostAttachments(
  ctx: ServiceContext,
  postId: string,
): Promise<Attachment[]> {
  const table = ctx.resources.ddb.table;
  const { Items } = await table.getDocumentClient().send(
    new QueryCommand({
      TableName: table.getName(),
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: {
        ":pk": `POST_ATTACHMENT#${postId}`,
      },
    }),
  );

  return (Items ?? []).map((i) => toAttachment(i as RawAttachmentItem));
}
