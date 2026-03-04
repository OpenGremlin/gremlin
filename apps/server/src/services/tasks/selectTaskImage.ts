import { generateText } from "ai";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";
import { getModel } from "../orchestrator/model.js";
import { renderPrompt } from "../prompts/index.js";

export const TASK_IMAGES = [
  "alarm_clock.png",
  "bra.png",
  "coding.png",
  "cooking_stew.png",
  "cooking_veggies.png",
  "editing.png",
  "light_bulb.png",
  "microscope.png",
  "music_mic.png",
  "office.png",
  "painting.png",
  "research.png",
  "shopping.png",
  "smart_owl.png",
  "travel.png",
  "writing_ink_quill.png",
] as const;

const VALID_SET = new Set<string>(TASK_IMAGES);

export async function selectAndSetTaskImage(
  ctx: ServiceContext,
  task: TaskItem,
): Promise<void> {
  try {
    const { text } = await generateText({
      model: await getModel(ctx),
      system: renderPrompt("taskImage", {
        images: TASK_IMAGES.join("\n"),
      }),
      messages: [{ role: "user", content: task.title }],
    });

    const image = text.trim();
    if (!VALID_SET.has(image)) return;

    await ctx.resources.ddb.entities.Task.build(UpdateItemCommand)
      .item({
        id: task.id,
        agentId: task.agentId,
        createdAt: task.createdAt,
        image,
      })
      .options({ returnValues: "NONE" })
      .send();

    ctx.resources.pubsub.publish(`taskUpdated:${task.id}`, {
      ...task,
      image,
    });
  } catch {
    // Silent failure — task simply has no image
  }
}
