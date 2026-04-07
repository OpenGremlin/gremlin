import { generateText } from "ai";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";
import { getModel } from "../orchestrator/model.js";
import { renderPrompt } from "../prompts/index.js";

/**
 * Returns true if the string is a single visible emoji grapheme.
 * Uses Intl.Segmenter to count graphemes, and checks the codepoint
 * is outside the basic ASCII range to filter out plain text like "NONE".
 */
function isSingleEmoji(value: string): boolean {
  if (!value) return false;
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
  const graphemes = Array.from(segmenter.segment(value));
  if (graphemes.length !== 1) return false;
  const codePoint = value.codePointAt(0);
  return codePoint != null && codePoint > 0x7f;
}

export async function selectAndSetTaskEmoji(
  ctx: ServiceContext,
  task: TaskItem,
): Promise<void> {
  try {
    const { text } = await generateText({
      model: await getModel(ctx),
      system: renderPrompt("taskEmoji"),
      messages: [{ role: "user", content: task.title }],
    });

    const emoji = text.trim();
    if (!isSingleEmoji(emoji)) return;

    await ctx.resources.ddb.entities.Task.build(UpdateItemCommand)
      .item({
        id: task.id,
        agentId: task.agentId,
        createdAt: task.createdAt,
        emoji,
      })
      .options({ returnValues: "NONE" })
      .send();

    ctx.resources.pubsub.publish(`taskUpdated:${task.id}`, {
      ...task,
      emoji,
    });
  } catch {
    // Silent failure — task simply has no emoji
  }
}
