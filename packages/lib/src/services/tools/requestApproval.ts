import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { tool } from "ai";
import { z } from "zod";
import { NotificationStatus } from "../../enums.js";
import type { ServiceContext } from "../context.js";

export function requestApprovalTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Request approval from the user before proceeding. This will send a notification and pause your execution until the user responds.",
    inputSchema: z.object({
      type: z
        .enum(["PERMISSION", "APPROVAL"])
        .describe(
          "PERMISSION for requesting access to a new integration scope, APPROVAL for any other decision",
        ),
      message: z.string().describe("Explain what you need and why you need it"),
      actions: z
        .array(
          z.object({
            id: z.string().describe("Unique action identifier"),
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
    execute: async ({ type, message, actions }) => {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      const table = ctx.resources.ddb.table;
      await table.getDocumentClient().send(
        new PutCommand({
          TableName: table.getName(),
          Item: {
            id,
            agentId,
            type,
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

      return { blocked: true, notificationId: id };
    },
  });
}
