import { describe, expect, it } from "vitest";
import { providers } from "./providers.js";

const oauthProviders = providers.filter((p) => p.connectionType === "oauth");

describe("OAuth provider config completeness", () => {
  it("has at least one OAuth provider", () => {
    expect(oauthProviders.length).toBeGreaterThan(0);
  });

  for (const provider of oauthProviders) {
    describe(provider.id, () => {
      it("has authorizeUrl", () => {
        expect(provider.authorizeUrl).toBeTruthy();
        expect(provider.authorizeUrl).toMatch(/^https:\/\//);
      });

      it("has tokenUrl", () => {
        expect(provider.tokenUrl).toBeTruthy();
        expect(provider.tokenUrl).toMatch(/^https:\/\//);
      });

      it("has userInfo config with valid method", () => {
        expect(provider.userInfo).toBeDefined();
        expect(provider.userInfo?.method).toMatch(/^(id_token|rest|graphql)$/);
      });

      it("has at least one available scope", () => {
        expect(provider.availableScopes.length).toBeGreaterThan(0);
      });
    });
  }
});

describe("OAuth provider userInfo config", () => {
  for (const provider of oauthProviders) {
    if (!provider.userInfo) continue;

    describe(`${provider.id} userInfo`, () => {
      if (provider.userInfo?.method === "id_token") {
        it("uses id_token method", () => {
          expect(provider.userInfo?.method).toBe("id_token");
        });
      }

      if (provider.userInfo?.method === "rest") {
        it("has url and path", () => {
          const info = provider.userInfo as {
            method: "rest";
            url: string;
            path: string;
          };
          expect(info.url).toMatch(/^https:\/\//);
          expect(info.path).toBeTruthy();
        });
      }

      if (provider.userInfo?.method === "graphql") {
        it("has url, query, and path", () => {
          const info = provider.userInfo as {
            method: "graphql";
            url: string;
            query: string;
            path: string;
          };
          expect(info.url).toMatch(/^https:\/\//);
          expect(info.query).toBeTruthy();
          expect(info.path).toBeTruthy();
        });
      }
    });
  }
});

describe("OAuth provider extraAuthParams serialization", () => {
  it("serializes extraAuthParams to JSON", () => {
    const google = providers.find((p) => p.id === "google");
    expect(google).toBeDefined();
    expect(google?.extraAuthParams).toBeDefined();
    const json = JSON.stringify(google?.extraAuthParams);
    const parsed = JSON.parse(json);
    expect(parsed.access_type).toBe("offline");
    expect(parsed.prompt).toBe("consent");
  });

  it("serializes userInfo to JSON and back", () => {
    const github = providers.find((p) => p.id === "github");
    expect(github).toBeDefined();
    expect(github?.userInfo).toBeDefined();
    const json = JSON.stringify(github?.userInfo);
    const parsed = JSON.parse(json);
    expect(parsed.method).toBe("rest");
    expect(parsed.url).toBe("https://api.github.com/user");
    expect(parsed.path).toBe("login");
  });

  it("returns null for providers without extraAuthParams", () => {
    const github = providers.find((p) => p.id === "github");
    expect(github).toBeDefined();
    const result = github?.extraAuthParams
      ? JSON.stringify(github.extraAuthParams)
      : null;
    expect(result).toBeNull();
  });
});

describe("Google scopes cover all GWS skills", () => {
  const google = providers.find((p) => p.id === "google");

  it("google provider exists", () => {
    expect(google).toBeDefined();
  });

  const scopeIds = google?.availableScopes.map((s) => s.scope) ?? [];

  const requiredBySkills = [
    // gws-gmail
    "gmail.readonly",
    "gmail.send",
    // gws-calendar
    "calendar.readonly",
    "calendar.events",
    // gws-docs
    "documents.readonly",
    "documents",
    // gws-drive
    "drive.readonly",
    "drive.file",
    // gws-sheets
    "spreadsheets.readonly",
    "spreadsheets",
    // gws-slides
    "presentations.readonly",
    "presentations",
  ];

  for (const scope of requiredBySkills) {
    it(`includes ${scope}`, () => {
      expect(scopeIds).toContain(scope);
    });
  }
});
