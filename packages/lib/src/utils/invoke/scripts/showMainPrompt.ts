// biome-ignore-all lint: Debug-only code

import {
  renderSystemPrompt,
  resolvePromptFlags,
} from "../../../services/prompts/index.js";
import {
  delegateTaskTool,
  listJobsTool,
  readDocumentTool,
  recallMemoryTool,
  saveMemoryTool,
  scheduleJobTool,
  updateJobTool,
  viewImageTool,
} from "../../../services/tools/index.js";
import type { InvokeContext } from "../index.js";

export default async function showMainPrompt(invokeCtx: InvokeContext) {
  const { ctx, agentId, memoryContext } = invokeCtx;
  const { agent, displayName, profile } = invokeCtx;

  const flags = resolvePromptFlags(agent.config, {
    modelSupportsImages: true,
    hasSkills: false,
  });

  const systemPrompt = renderSystemPrompt(
    {
      name: agent.name,
      soul: agent.soul,
      userDisplayName: displayName,
      userAbout: profile?.about,
    },
    flags,
  );

  const tools: Record<string, any> = {
    delegateTask: delegateTaskTool(ctx, agentId),
    readDocument: readDocumentTool(),
    saveMemory: saveMemoryTool(ctx, agentId),
    recallMemory: recallMemoryTool(ctx, agentId),
    listJobs: listJobsTool(ctx, agentId),
    scheduleJob: scheduleJobTool(ctx, agentId),
    updateJob: updateJobTool(ctx, agentId),
    ...(flags.viewImage ? { viewImage: viewImageTool(ctx) } : {}),
  };

  const tz = "UTC";
  const currentTime = new Date().toLocaleString("en-US", { timeZone: tz });

  const systemMessages = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `Current time: ${currentTime} (${tz})` },
    ...(memoryContext ? [{ role: "system", content: memoryContext }] : []),
  ];

  for (let i = 0; i < systemMessages.length; i++) {
    console.log("=".repeat(80));
    console.log(`SYSTEM MESSAGE ${i + 1}`);
    console.log("=".repeat(80));
    console.log(systemMessages[i].content);
    console.log();
  }

  console.log("=".repeat(80));
  console.log("TOOLS");
  console.log("=".repeat(80));

  for (const [name, t] of Object.entries(tools)) {
    const desc = (t as any).description ?? "(no description)";
    const params: string[] = [];

    const shape = (t as any).inputSchema?.shape;
    if (shape) {
      for (const [key, val] of Object.entries(shape)) {
        const optional = (val as any).isOptional?.() ? "?" : "";
        const paramDesc = (val as any).description;
        params.push(`${key}${optional}${paramDesc ? ` — ${paramDesc}` : ""}`);
      }
    }

    console.log(`\n  ${name}`);
    console.log(`    ${desc.split("\n")[0]}`);
    if (params.length > 0) {
      console.log(`    params: ${params.join(", ")}`);
    }
  }

  console.log("\n" + "=".repeat(80));
}
