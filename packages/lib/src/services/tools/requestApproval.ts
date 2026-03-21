import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { tool } from "ai";
import { z } from "zod";
import { NotificationStatus } from "../../enums.js";
import type { ServiceContext } from "../context.js";

export function requestApprovalTool(
  ctx: ServiceContext,
  agentId: string,
  lane: string,
) {
  return tool({
    description:
      "Request approval from the user before proceeding. This will send a notification and pause your execution until the user responds.",
    inputSchema: z.object({
      message: z.string().describe("Explain what you need and why you need it"),
      actions: z
        .array(
          z.object({
            label: z.string().describe("Button label shown to the user"),
            style: z
              .enum(["primary", "secondary"])
              .describe(
                "primary for the recommended action, secondary for alternatives",
              ),
          }),
        )
        .min(2)
        .describe("The choices to present to the user"),
    }),
    execute: async ({ message, actions }) => {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      const table = ctx.resources.ddb.table;
      await table.getDocumentClient().send(
        new PutCommand({
          TableName: table.getName(),
          Item: {
            id,
            agentId,
            lane,
            turnId: null,
            message,
            actions,
            status: NotificationStatus.Pending,
            resolvedAction: null,
            createdAt,
            _et: "Notification",
            pk: "NOTIFICATION",
            sk: `NOTIFICATION#${id}`,
            gsi1pk: `NOTIF_STATUS#${NotificationStatus.Pending}`,
            gsi1sk: createdAt,
          },
        }),
      );

      return { ok: true };
    },
  });
}
