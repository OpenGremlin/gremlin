import { describe, expect, it } from "vitest";
import { intentToNode, MAX_CANVAS_CONTENT_BYTES } from "./canvas.js";

describe("intentToNode", () => {
  it("emits an image node when context has imageUrl", () => {
    const node = intentToNode("show the chart", {
      imageUrl: "https://example.com/chart.png",
      alt: "Q1 vs Q2",
    });
    expect(node).toEqual({
      type: "image",
      url: "https://example.com/chart.png",
      alt: "Q1 vs Q2",
    });
  });

  it("falls back to the intent as alt text when alt is missing", () => {
    const node = intentToNode("Q1 chart", {
      imageUrl: "https://example.com/chart.png",
    });
    expect(node).toMatchObject({ type: "image", alt: "Q1 chart" });
  });

  it("emits a code node when context has code", () => {
    const node = intentToNode("walking through it", {
      code: "const x = 1;",
      lang: "ts",
    });
    expect(node).toEqual({
      type: "code",
      lang: "ts",
      content: "const x = 1;",
    });
  });

  it("defaults to text when context is a plain string", () => {
    const node = intentToNode("here is the result", "42");
    expect(node).toEqual({
      type: "text",
      content: "here is the result\n\n42",
    });
  });

  it("defaults to text when no context is supplied", () => {
    expect(intentToNode("done!", undefined)).toEqual({
      type: "text",
      content: "done!",
    });
  });

  it("truncates oversized text content with a marker", () => {
    const big = "x".repeat(MAX_CANVAS_CONTENT_BYTES * 2);
    const node = intentToNode("big dump", big);
    if (node.type !== "text") throw new Error("expected text node");
    expect(Buffer.byteLength(node.content, "utf8")).toBeLessThanOrEqual(
      MAX_CANVAS_CONTENT_BYTES,
    );
    expect(node.content).toMatch(/…\(truncated\)$/);
  });

  it("truncates oversized code content too", () => {
    const big = "x".repeat(MAX_CANVAS_CONTENT_BYTES * 2);
    const node = intentToNode("big code", { code: big, lang: "txt" });
    if (node.type !== "code") throw new Error("expected code node");
    expect(Buffer.byteLength(node.content, "utf8")).toBeLessThanOrEqual(
      MAX_CANVAS_CONTENT_BYTES,
    );
  });
});
