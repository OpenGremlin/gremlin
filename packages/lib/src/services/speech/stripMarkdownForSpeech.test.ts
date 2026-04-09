import { describe, expect, it } from "vitest";
import {
  cleanCodeForSpeech,
  linearizeTable,
  stripMarkdownForSpeech,
} from "./stripMarkdownForSpeech.js";

describe("stripMarkdownForSpeech", () => {
  describe("ordered lists", () => {
    it("converts numbers to words", () => {
      expect(stripMarkdownForSpeech("1. First item\n2. Second item")).toBe(
        "one. First item two. Second item",
      );
    });

    it("handles numbers above 20 as digits", () => {
      expect(stripMarkdownForSpeech("21. Twenty-first item")).toBe(
        "21. Twenty-first item",
      );
    });
  });

  describe("task lists", () => {
    it("converts checked items", () => {
      expect(stripMarkdownForSpeech("- [x] Write tests")).toBe(
        "Write tests, done.",
      );
    });

    it("converts unchecked items", () => {
      expect(stripMarkdownForSpeech("- [ ] Deploy to prod")).toBe(
        "Deploy to prod, not yet done.",
      );
    });
  });

  describe("images", () => {
    it("reads alt text", () => {
      expect(
        stripMarkdownForSpeech("![A sunset over mountains](image.png)"),
      ).toBe("A sunset over mountains");
    });

    it("removes images with no alt text", () => {
      expect(stripMarkdownForSpeech("before ![](image.png) after")).toBe(
        "before after",
      );
    });
  });

  describe("links", () => {
    it("keeps link text, drops URL", () => {
      expect(
        stripMarkdownForSpeech("[the docs](https://example.com/docs)"),
      ).toBe("the docs");
    });
  });

  describe("inline formatting", () => {
    it("strips bold", () => {
      expect(stripMarkdownForSpeech("This is **important** text")).toBe(
        "This is important text",
      );
    });

    it("strips italic", () => {
      expect(stripMarkdownForSpeech("This is *emphasized* text")).toBe(
        "This is emphasized text",
      );
    });

    it("strips strikethrough", () => {
      expect(stripMarkdownForSpeech("~~old~~ new")).toBe("old new");
    });

    it("strips inline code", () => {
      expect(stripMarkdownForSpeech("Run `npm install` first")).toBe(
        "Run npm install first",
      );
    });
  });

  describe("headings", () => {
    it("strips heading markers", () => {
      expect(stripMarkdownForSpeech("## Getting Started")).toBe(
        "Getting Started",
      );
    });
  });

  describe("blockquotes", () => {
    it("strips blockquote markers", () => {
      expect(stripMarkdownForSpeech("> To be or not to be")).toBe(
        "To be or not to be",
      );
    });
  });

  describe("unordered lists", () => {
    it("strips bullet markers", () => {
      expect(stripMarkdownForSpeech("- First\n- Second")).toBe("First Second");
    });
  });

  describe("horizontal rules", () => {
    it("removes horizontal rules", () => {
      expect(stripMarkdownForSpeech("Above\n---\nBelow")).toBe("Above Below");
    });
  });
});

describe("cleanCodeForSpeech", () => {
  it("strips comment markers but keeps text", () => {
    expect(cleanCodeForSpeech("// This is important")).toBe(
      "This is important",
    );
  });

  it("strips block comment markers", () => {
    expect(cleanCodeForSpeech("/* hello */ world")).toBe("hello world");
  });

  it("strips hash comments", () => {
    expect(cleanCodeForSpeech("# Set the value\nx = 5")).toBe(
      "Set the value x = 5",
    );
  });

  it("strips semicolons", () => {
    expect(cleanCodeForSpeech("const x = 5;")).toBe("const x = 5");
    expect(cleanCodeForSpeech("a; b; c;")).toBe("a b c");
  });

  it("strips structural brackets", () => {
    expect(cleanCodeForSpeech("function foo() { return 1; }")).toBe(
      "function foo return 1",
    );
  });

  it("converts arrow operator", () => {
    expect(cleanCodeForSpeech("const fn = () => x")).toBe("const fn = arrow x");
  });
});

describe("linearizeTable", () => {
  it("reads rows with header context", () => {
    expect(
      linearizeTable(["| Name | Age |", "| Alice | 30 |", "| Bob | 25 |"]),
    ).toBe("Name: Alice, Age: 30. Name: Bob, Age: 25");
  });

  it("skips separator rows", () => {
    expect(
      linearizeTable(["| Name | Age |", "|------|-----|", "| Alice | 30 |"]),
    ).toBe("Name: Alice, Age: 30");
  });

  it("handles header-only table", () => {
    expect(linearizeTable(["| A | B | C |"])).toBe("A, B, C");
  });

  it("returns empty for empty input", () => {
    expect(linearizeTable([])).toBe("");
  });
});
