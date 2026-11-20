import { describe, expect, it } from "vitest";
import { LEGACY_APP_REDIRECTS } from "./app-routes";

describe("legacy app redirects", () => {
  it("sends /generate to the in-app New event page", () => {
    expect(LEGACY_APP_REDIRECTS["/generate"]).toBe("/app/new");
  });
  it("sends /import to the in-app Import page", () => {
    expect(LEGACY_APP_REDIRECTS["/import"]).toBe("/app/import");
  });
});
