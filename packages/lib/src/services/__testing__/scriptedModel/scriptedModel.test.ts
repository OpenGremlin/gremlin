import { generateText, stepCountIs, streamText, tool } from "ai";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { scriptedModel } from "./index.js";

describe("scriptedModel", () => {
  it("emits a single text response through streamText", async () => {
    const model = scriptedModel([[{ kind: "text", text: "hello world" }]]);

    const result = streamText({
      model,
      messages: [{ role: "user", content: "hi" }],
    });

    expect(await result.text).toBe("hello world");
  });

  it("emits text in chunks visible to onChunk", async () => {
    const model = scriptedModel([
      [
        { kind: "text", text: "part one " },
        { kind: "text", text: "part two" },
      ],
    ]);

    const seen: string[] = [];
    const result = streamText({
      model,
      messages: [{ role: "user", content: "hi" }],
      onChunk: ({ chunk }) => {
        if (chunk.type === "text-delta") seen.push(chunk.text);
      },
    });
    await result.text;

    expect(seen).toEqual(["part one ", "part two"]);
  });

  it("drives the streamText tool loop: toolCall → tool executes → final text", async () => {
    const model = scriptedModel([
      [{ kind: "toolCall", toolName: "echo", input: { msg: "hi" } }],
      [{ kind: "text", text: "The tool said: hi" }],
    ]);

    const toolExecutions: unknown[] = [];
    const result = streamText({
      model,
      messages: [{ role: "user", content: "please echo" }],
      stopWhen: stepCountIs(5),
      tools: {
        echo: tool({
          description: "Echo a message",
          inputSchema: z.object({ msg: z.string() }),
          execute: async ({ msg }) => {
            toolExecutions.push({ msg });
            return `echoed: ${msg}`;
          },
        }),
      },
    });

    expect(await result.text).toBe("The tool said: hi");
    expect(toolExecutions).toEqual([{ msg: "hi" }]);
  });

  it("works as a drop-in model for generateText", async () => {
    const model = scriptedModel([
      [{ kind: "text", text: "one-shot response" }],
    ]);

    const result = await generateText({
      model,
      messages: [{ role: "user", content: "q" }],
    });

    expect(result.text).toBe("one-shot response");
  });
});
