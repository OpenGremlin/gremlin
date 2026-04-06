import { describe, expect, it } from "vitest";
import { HeadTailBuffer } from "./headTailBuffer.js";

describe("HeadTailBuffer", () => {
  it("returns small input unchanged", () => {
    const buf = new HeadTailBuffer(100);
    buf.append("hello world");
    expect(buf.toString()).toBe("hello world");
    expect(buf.totalBytes).toBe(11);
  });

  it("accumulates multiple small appends", () => {
    const buf = new HeadTailBuffer(100);
    buf.append("aaa");
    buf.append("bbb");
    buf.append("ccc");
    expect(buf.toString()).toBe("aaabbbccc");
    expect(buf.totalBytes).toBe(9);
  });

  it("fills head only when input fits exactly", () => {
    const buf = new HeadTailBuffer(5);
    buf.append("12345");
    expect(buf.toString()).toBe("12345");
    expect(buf.totalBytes).toBe(5);
  });

  it("truncates head when a single append exceeds halfSize", () => {
    const buf = new HeadTailBuffer(5);
    buf.append("1234567890");
    expect(buf.toString()).toBe("12345");
    expect(buf.totalBytes).toBe(10);
  });

  it("keeps head and tail, dropping the middle", () => {
    const buf = new HeadTailBuffer(5);
    // Fill head
    buf.append("AAAAA");
    // This goes to tail
    buf.append("BBBBB");
    buf.append("CCCCC");
    buf.append("DDDDD");

    const result = buf.toString();
    // Head: "AAAAA", tail keeps last 5 chars
    expect(result.startsWith("AAAAA")).toBe(true);
    expect(result.endsWith("DDDDD")).toBe(true);
    expect(result.length).toBe(10); // 5 head + 5 tail
    expect(buf.totalBytes).toBe(20);
  });

  it("rolls the tail buffer correctly", () => {
    const buf = new HeadTailBuffer(4);
    buf.append("HEAD"); // fills head exactly
    buf.append("xxxx"); // tail starts
    buf.append("yyyy"); // tail grows
    buf.append("TAIL"); // tail rolls, keeps last 4

    expect(buf.toString()).toBe("HEADTAIL");
    expect(buf.totalBytes).toBe(16);
  });

  it("handles chunk boundaries that split across head filling", () => {
    const buf = new HeadTailBuffer(6);
    buf.append("AAA"); // head = "AAA"
    buf.append("BBBXXX"); // head fills to "AAABBB" (6), "XXX" overflow goes... head is now full
    // After this: head = "AAABBB", headFull = true
    // The "XXX" part of the append is lost from head but counted in totalBytes

    buf.append("TAIL"); // goes to tail

    const result = buf.toString();
    expect(result.startsWith("AAABBB")).toBe(true);
    expect(result.endsWith("TAIL")).toBe(true);
    expect(buf.totalBytes).toBe(13);
  });

  it("tracks totalBytes accurately across many appends", () => {
    const buf = new HeadTailBuffer(10);
    for (let i = 0; i < 100; i++) {
      buf.append("x");
    }
    expect(buf.totalBytes).toBe(100);
    // Output should be 10 (head) + 10 (tail) = 20 chars max
    expect(buf.toString().length).toBeLessThanOrEqual(20);
  });

  it("returns empty string for no input", () => {
    const buf = new HeadTailBuffer(10);
    expect(buf.toString()).toBe("");
    expect(buf.totalBytes).toBe(0);
  });
});
