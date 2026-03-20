// biome-ignore-all lint: Debug-only code

import type { InvokeContext } from "../index.js";

export default async function showPrompt(invokeCtx: InvokeContext) {
  const { systemPrompt, memoryContext, tools } = invokeCtx;

  const tz = "UTC";
  const currentTime = new Date().toLocaleString("en-US", { timeZone: tz });

  const systemMessages = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `Current time: ${currentTime} (${tz})` },
    ...(memoryContext ? [{ role: "system", content: memoryContext }] : []),
  ];

  // Print full prompt (all system messages as sent to the model)
  for (let i = 0; i < systemMessages.length; i++) {
    console.log("=".repeat(80));
    console.log(`SYSTEM MESSAGE ${i + 1}`);
    console.log("=".repeat(80));
    console.log(systemMessages[i].content);
    console.log();
  }

  // Print available tools
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
