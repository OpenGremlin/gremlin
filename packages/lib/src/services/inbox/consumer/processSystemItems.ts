import type { InboxItemItem } from "../../../resources/ddb/schema/inboxItem.js";
import type { ServiceContext } from "../../context.js";
import { handleScheduledJob } from "./handleScheduledJob.js";

/** Process system-lane items (scheduled jobs, core memory reviews). No inference. */
export async function processSystemItems(
  ctx: ServiceContext,
  agentId: string,
  items: InboxItemItem[],
): Promise<void> {
  for (const item of items) {
    const payload = JSON.parse(item.payload);
    switch (item.type) {
      case "scheduled_job":
        await handleScheduledJob(ctx, agentId, payload);
        break;
      case "core_memory_review":
        await ctx.services.memory
          .reviewCoreMemories(ctx, agentId)
          .catch((err) =>
            ctx.log.error(
              { err, component: "core-memories" },
              "Core memory review failed",
            ),
          );
        break;
    }
  }
}
