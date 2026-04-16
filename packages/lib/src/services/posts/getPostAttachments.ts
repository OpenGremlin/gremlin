import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";
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

/**
 * Get attachments for a post by batch-getting TaskAttachment records
 * using the attachment IDs stored on the post.
 */
export async function getPostAttachments(
  ctx: ServiceContext,
  attachmentIds: string[],
): Promise<Attachment[]> {
  if (attachmentIds.length === 0) return [];

  const table = ctx.resources.ddb.chatTable;
  const tableName = table.getName();
  const docClient = table.getDocumentClient();

  // BatchGetItem supports max 100 keys per request
  const chunks: string[][] = [];
  for (let i = 0; i < attachmentIds.length; i += 100) {
    chunks.push(attachmentIds.slice(i, i + 100));
  }

  const allItems: RawAttachmentItem[] = [];

  for (const chunk of chunks) {
    const { Responses } = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [tableName]: {
            Keys: chunk.map((id) => ({
              pk: `ATTACHMENT#${id}`,
              sk: "ATTACHMENT",
            })),
          },
        },
      }),
    );

    const items = Responses?.[tableName] ?? [];
    allItems.push(...(items as RawAttachmentItem[]));
  }

  const byKey = new Map<string, Attachment>();
  for (const raw of allItems) {
    const a = toAttachment(raw);
    const key = a.type === "file" ? `file:${a.path}` : `link:${a.url}`;
    if (!byKey.has(key)) byKey.set(key, a);
  }
  // Sort by key so files (prefix "file:") come before links ("link:"),
  // each group ordered alphabetically by path / url.
  return [...byKey.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, a]) => a);
}
