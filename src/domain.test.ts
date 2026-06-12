import { describe, expect, it } from "vitest";
import { appStateSchema, can, seedState } from "./domain";

describe("frontend mock contracts", () => {
  it("validates the complete seeded state", () => {
    expect(appStateSchema.parse(seedState)).toEqual(seedState);
  });

  it("keeps the report page collection extensible", () => {
    expect(seedState.pages.length).toBeGreaterThan(3);
    expect(new Set(seedState.pages.map((page) => page.templateId)).size).toBe(seedState.pages.length);
  });

  it("models an organization portfolio with multiple customer workspaces", () => {
    expect(seedState.workspaces.length).toBeGreaterThan(1);
    expect(seedState.workspaces.some((workspace) => workspace.id === "lysol")).toBe(true);
    expect(new Set(seedState.workspaces.map((workspace) => workspace.id)).size).toBe(seedState.workspaces.length);
  });

  it("enforces demo role capabilities", () => {
    expect(can("analyst", "edit")).toBe(true);
    expect(can("analyst", "approve")).toBe(false);
    expect(can("reviewer", "approve")).toBe(true);
    expect(can("client_viewer", "edit")).toBe(false);
  });
});
