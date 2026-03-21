import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { tool } from "ai";
import { z } from "zod";
import { UserInputRequestStatus } from "../../enums.js";
import type { ServiceContext } from "../context.js";

export function requestUserInputTool(
  ctx: ServiceContext,
  agentId: string,
  lane: string,
) {
  return tool({
    description:
      "Ask the user for permission or input before proceeding. Use this when you need the user to make a decision, confirm an action, or choose between options. Your execution will pause until the user responds.",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "Explain what you need from the user — what decision or permission you're asking for and why",
        ),
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
            status: UserInputRequestStatus.Pending,
            resolvedAction: null,
            createdAt,
            _et: "UserInputRequest",
            pk: "USER_INPUT_REQUEST",
            sk: `USER_INPUT_REQUEST#${id}`,
            gsi1pk: `INPUT_REQUEST_STATUS#${UserInputRequestStatus.Pending}`,
            gsi1sk: createdAt,
          },
        }),
      );

      return { ok: true };
    },
  });
}
