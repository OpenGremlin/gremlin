import { describe, expect, it } from "vitest";
import { cleanTextForSpeech } from "./cleanTextForSpeech.js";

describe("cleanTextForSpeech", () => {
  it("strips basic markdown", () => {
    expect(cleanTextForSpeech("Hello **world**!")).toBe("Hello world!");
  });

  it("replaces a fenced code block", () => {
    const input = "Before\n```js\nconsole.log('hi');\n```\nAfter";
    expect(cleanTextForSpeech(input)).toBe("Before Here's a code block. After");
  });

  it("replaces multiple code blocks", () => {
    const input = "A\n```\ncode1\n```\nB\n```\ncode2\n```\nC";
    const result = cleanTextForSpeech(input);
    expect(result).toContain("Here's a code block.");
    expect(result).toContain("A");
    expect(result).toContain("B");
    expect(result).toContain("C");
  });

  it("replaces a markdown table", () => {
    const input = "Look:\n| a | b |\n| --- | --- |\n| 1 | 2 |\nDone.";
    expect(cleanTextForSpeech(input)).toBe("Look: Here's a table. Done.");
  });

  it("handles plain text unchanged", () => {
    expect(cleanTextForSpeech("Just a sentence.")).toBe("Just a sentence.");
  });

  it("returns empty string for empty input", () => {
    expect(cleanTextForSpeech("")).toBe("");
  });

  it("strips emojis", () => {
    expect(cleanTextForSpeech("Hello 👋 world")).toBe("Hello world");
  });

  it("converts links to text", () => {
    expect(cleanTextForSpeech("Visit [Google](https://google.com) now")).toBe(
      "Visit Google now",
    );
  });
});
