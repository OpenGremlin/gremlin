import { describe, expect, it } from "vitest";
import { SentenceAccumulator } from "./SentenceAccumulator.js";

/** Helper: feed a full string token-by-token (one character at a time). */
function pushChars(acc: SentenceAccumulator, text: string): string[] {
  const out: string[] = [];
  for (const ch of text) {
    out.push(...acc.push(ch));
  }
  return out;
}

/** Helper: collect all emitted sentences including flush. */
function collect(text: string): string[] {
  const acc = new SentenceAccumulator();
  const out = pushChars(acc, text);
  const last = acc.flush();
  if (last) out.push(last);
  return out;
}

describe("SentenceAccumulator", () => {
  describe("basic sentence splitting", () => {
    it("splits on period followed by space", () => {
      expect(collect("Hello world. Goodbye world. ")).toEqual([
        "Hello world. Goodbye world.",
      ]);
    });

    it("splits on exclamation mark", () => {
      expect(collect("Wow! That is really great news for us all. ")).toEqual([
        "Wow! That is really great news for us all.",
      ]);
    });

    it("splits on question mark", () => {
      // Each sentence is 5+ words so they emit separately
      expect(
        collect("Is it raining outside today? Yes it certainly is indeed. "),
      ).toEqual([
        "Is it raining outside today?",
        "Yes it certainly is indeed.",
      ]);
    });

    it("flushes remaining text", () => {
      const acc = new SentenceAccumulator();
      const emitted = acc.push(
        "The dragon roared with great fury across the land",
      );
      expect(emitted).toEqual([]);
      expect(acc.flush()).toBe(
        "The dragon roared with great fury across the land",
      );
    });
  });

  describe("minimum word threshold", () => {
    it("holds short sentences until threshold is met", () => {
      const acc = new SentenceAccumulator();
      // "The End." = 2 words, below threshold
      expect(acc.push("The End. ")).toEqual([]);
      // "It was done." = 3 words, combined = 5 words, meets threshold
      expect(acc.push("It was done. ")).toEqual(["The End. It was done."]);
    });

    it("emits a long sentence immediately", () => {
      const acc = new SentenceAccumulator();
      expect(acc.push("The quick brown fox jumps over the lazy dog. ")).toEqual(
        ["The quick brown fox jumps over the lazy dog."],
      );
    });

    it("flush emits pending short sentences", () => {
      const acc = new SentenceAccumulator();
      acc.push("Hey. ");
      expect(acc.flush()).toBe("Hey.");
    });

    it("flush combines pending with remaining buffer", () => {
      const acc = new SentenceAccumulator();
      acc.push("Hi. ");
      acc.push("Bye");
      expect(acc.flush()).toBe("Hi. Bye");
    });

    it("batches multiple short sentences", () => {
      const acc = new SentenceAccumulator();
      expect(acc.push("Go. ")).toEqual([]);
      expect(acc.push("Now. ")).toEqual([]);
      expect(acc.push("Run far away from here please. ")).toEqual([
        "Go. Now. Run far away from here please.",
      ]);
    });
  });

  describe("abbreviations", () => {
    it("does not split on common abbreviations", () => {
      expect(
        collect("Talk to Dr. Smith about the appointment today. "),
      ).toEqual(["Talk to Dr. Smith about the appointment today."]);
    });

    it("does not split on Mr. or Mrs.", () => {
      expect(
        collect("Mr. and Mrs. Jones went to the store together. "),
      ).toEqual(["Mr. and Mrs. Jones went to the store together."]);
    });

    it("does not split on e.g. or i.e.", () => {
      expect(
        collect("Use a connector, e.g. a cable for your device. "),
      ).toEqual(["Use a connector, e.g. a cable for your device."]);
    });

    it("does not split on initials", () => {
      expect(
        collect("J. K. Rowling wrote many wonderful popular books. "),
      ).toEqual(["J. K. Rowling wrote many wonderful popular books."]);
    });
  });

  describe("ellipsis", () => {
    it("does not split on ellipsis", () => {
      expect(collect("Wait for it... the answer is forty two. ")).toEqual([
        "Wait for it... the answer is forty two.",
      ]);
    });
  });

  describe("decimal numbers", () => {
    it("does not split on decimal points", () => {
      expect(collect("The value is 3.14 and that is quite precise. ")).toEqual([
        "The value is 3.14 and that is quite precise.",
      ]);
    });
  });

  describe("code blocks", () => {
    it("emits placeholder for fenced code blocks", () => {
      const text =
        "Here is some example code for you.\n```js\nconsole.log('hi');\n```\nThen we continue on with our work. ";
      expect(collect(text)).toEqual([
        "Here is some example code for you.",
        "Here's a code block. Then we continue on with our work.",
      ]);
    });

    it("handles unterminated code block on flush", () => {
      const acc = new SentenceAccumulator();
      acc.push("Look at this example code.\n```\nsome code here");
      expect(acc.flush()).toBe("Here's a code block.");
    });
  });

  describe("tables", () => {
    it("emits placeholder for tables", () => {
      const acc = new SentenceAccumulator();
      expect(acc.push("Here is a nice data table.\n")).toEqual([
        "Here is a nice data table.",
      ]);
      expect(acc.push("| A | B |\n")).toEqual([]);
      expect(acc.push("| 1 | 2 |\n")).toEqual([]);
      // Non-table line closes the table and the text after it
      expect(acc.push("After the table we continue onward.\n")).toEqual([
        "Here's a table. After the table we continue onward.",
      ]);
    });

    it("handles unterminated table on flush", () => {
      const acc = new SentenceAccumulator();
      acc.push("Look at this.\n");
      acc.push("| X | Y |\n");
      acc.push("| 1 | 2 |\n");
      expect(acc.flush()).toBe("Look at this. Here's a table.");
    });
  });

  describe("streaming token-by-token", () => {
    it("produces same result as bulk push", () => {
      const text =
        "The quick brown fox jumped over the lazy dog. It was a sunny day outside. ";
      const bulk = collect(text);

      const acc = new SentenceAccumulator();
      const streamed = pushChars(acc, text);
      const last = acc.flush();
      if (last) streamed.push(last);

      expect(streamed).toEqual(bulk);
    });
  });

  describe("no trailing whitespace edge case", () => {
    it("does not emit sentence without trailing whitespace", () => {
      const acc = new SentenceAccumulator();
      // No space after period — boundary not confirmed yet
      expect(acc.push("Hello world.")).toEqual([]);
      // Flush should return it
      expect(acc.flush()).toBe("Hello world.");
    });
  });
});
