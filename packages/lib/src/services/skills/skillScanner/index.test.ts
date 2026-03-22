import { describe, expect, it } from "vitest";
import { getSkillReferenceFromS3 } from "./index.js";

describe("skillScanner", () => {
  describe("getSkillReferenceFromS3 path traversal guard", () => {
    it("blocks .. in reference name", async () => {
      expect(await getSkillReferenceFromS3(null, "gws-gmail", "..")).toBeNull();
    });

    it("blocks forward slashes", async () => {
      expect(
        await getSkillReferenceFromS3(null, "gws-gmail", "foo/bar"),
      ).toBeNull();
    });

    it("blocks backslashes", async () => {
      expect(
        await getSkillReferenceFromS3(null, "gws-gmail", "foo\\bar"),
      ).toBeNull();
    });

    it("allows valid reference names", async () => {
      const content = await getSkillReferenceFromS3(null, "gws-gmail", "send");
      expect(content).not.toBeNull();
    });
  });
});
