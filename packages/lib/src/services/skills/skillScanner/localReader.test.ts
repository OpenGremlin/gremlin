import { describe, expect, it } from "vitest";
import {
  getLocalReference,
  getLocalTemplate,
  listLocalReferences,
  scanLocalCatalog,
} from "./localReader.js";

describe("localReader", () => {
  describe("scanLocalCatalog", () => {
    it("returns parsed templates from the local skills directory", () => {
      const templates = scanLocalCatalog();
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.id).toBeTruthy();
        expect(t.name).toBeTruthy();
      }
    });
  });

  describe("getLocalTemplate", () => {
    it("returns a template for a known skill", () => {
      const template = getLocalTemplate("gws-gmail");
      expect(template).not.toBeNull();
      expect(template?.id).toBe("gws-gmail");
    });

    it("returns null for an unknown skill", () => {
      expect(getLocalTemplate("nonexistent-skill")).toBeNull();
    });
  });

  describe("getLocalReference", () => {
    it("returns content for a known reference", () => {
      const content = getLocalReference("gws-gmail", "send");
      expect(content).not.toBeNull();
      expect(content?.length).toBeGreaterThan(0);
    });

    it("returns null for an unknown reference", () => {
      expect(getLocalReference("gws-gmail", "nonexistent")).toBeNull();
    });
  });

  describe("listLocalReferences", () => {
    it("returns reference names for a known skill", () => {
      const refs = listLocalReferences("gws-gmail");
      expect(refs).toContain("send");
      expect(refs).toContain("read");
    });

    it("returns empty array for an unknown skill", () => {
      expect(listLocalReferences("nonexistent-skill")).toEqual([]);
    });
  });
});
