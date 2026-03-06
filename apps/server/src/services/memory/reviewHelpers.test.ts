import { describe, expect, it } from "vitest";
import { buildReviewPrompt, parseReviewResponse } from "./reviewHelpers.js";

const sampleCore = [
  { tenet: "Prefers dark mode", shapedBy: ["asked to enable dark theme"] },
  { tenet: "Likes concise answers", shapedBy: ["said keep it short"] },
];

describe("buildReviewPrompt", () => {
  it("includes current core memories as JSON when non-empty", () => {
    const result = buildReviewPrompt(sampleCore, "");
    expect(result).toContain("## Current core memories");
    expect(result).toContain(JSON.stringify(sampleCore, null, 2));
  });

  it('includes "None yet." when currentCore is empty', () => {
    const result = buildReviewPrompt([], "");
    expect(result).toContain("## Current core memories\nNone yet.");
  });

  it("includes yesterday content when provided", () => {
    const result = buildReviewPrompt([], "User discussed TypeScript generics");
    expect(result).toContain("## Yesterday's memories");
    expect(result).toContain("User discussed TypeScript generics");
  });

  it('includes "No new memories from yesterday." when yesterdayContent is empty', () => {
    const result = buildReviewPrompt([], "");
    expect(result).toContain("No new memories from yesterday.");
  });

  it("always includes Instructions section", () => {
    const result = buildReviewPrompt([], "");
    expect(result).toContain("## Instructions");
    expect(result).toContain("Maximum 10 core memories");
  });
});

describe("parseReviewResponse", () => {
  const fallback = [
    { tenet: "fallback tenet", shapedBy: ["fallback reason"] },
  ];

  it("parses a valid JSON array", () => {
    const input = JSON.stringify([
      { tenet: "Likes tests", shapedBy: ["wrote many tests"] },
    ]);
    const result = parseReviewResponse(input, fallback);
    expect(result).toEqual([
      { tenet: "Likes tests", shapedBy: ["wrote many tests"] },
    ]);
  });

  it("strips markdown code fences", () => {
    const input = '```json\n[{"tenet":"A","shapedBy":["b"]}]\n```';
    const result = parseReviewResponse(input, fallback);
    expect(result).toEqual([{ tenet: "A", shapedBy: ["b"] }]);
  });

  it("strips code fences without language tag", () => {
    const input = '```\n[{"tenet":"A","shapedBy":["b"]}]\n```';
    const result = parseReviewResponse(input, fallback);
    expect(result).toEqual([{ tenet: "A", shapedBy: ["b"] }]);
  });

  it("returns fallback when response is not an array", () => {
    const input = JSON.stringify({ tenet: "not array", shapedBy: [] });
    const result = parseReviewResponse(input, fallback);
    expect(result).toEqual(fallback);
  });

  it("returns fallback when JSON parse fails", () => {
    const result = parseReviewResponse("not json at all", fallback);
    expect(result).toEqual(fallback);
  });

  it("clamps to max 10 items", () => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      tenet: `Tenet ${i}`,
      shapedBy: [`reason ${i}`],
    }));
    const result = parseReviewResponse(JSON.stringify(items), fallback);
    expect(result).toHaveLength(10);
    expect(result[0].tenet).toBe("Tenet 0");
    expect(result[9].tenet).toBe("Tenet 9");
  });

  it("skips items with non-string tenet", () => {
    const input = JSON.stringify([
      { tenet: 123, shapedBy: ["reason"] },
      { tenet: "Valid", shapedBy: ["ok"] },
    ]);
    const result = parseReviewResponse(input, fallback);
    expect(result).toEqual([{ tenet: "Valid", shapedBy: ["ok"] }]);
  });

  it("skips items with non-array shapedBy", () => {
    const input = JSON.stringify([
      { tenet: "A", shapedBy: "not an array" },
      { tenet: "B", shapedBy: ["ok"] },
    ]);
    const result = parseReviewResponse(input, fallback);
    expect(result).toEqual([{ tenet: "B", shapedBy: ["ok"] }]);
  });

  it("skips items where shapedBy contains non-strings", () => {
    const input = JSON.stringify([
      { tenet: "A", shapedBy: [1, 2] },
      { tenet: "B", shapedBy: ["valid"] },
    ]);
    const result = parseReviewResponse(input, fallback);
    expect(result).toEqual([{ tenet: "B", shapedBy: ["valid"] }]);
  });

  it("returns empty array when all items are invalid", () => {
    const input = JSON.stringify([
      { tenet: 1, shapedBy: "bad" },
      { bad: "shape" },
    ]);
    const result = parseReviewResponse(input, fallback);
    expect(result).toEqual([]);
  });

  it("only keeps tenet and shapedBy fields (no extra properties)", () => {
    const input = JSON.stringify([
      { tenet: "A", shapedBy: ["b"], extra: "field" },
    ]);
    const result = parseReviewResponse(input, fallback);
    expect(result).toEqual([{ tenet: "A", shapedBy: ["b"] }]);
    expect(Object.keys(result[0])).toEqual(["tenet", "shapedBy"]);
  });
});
