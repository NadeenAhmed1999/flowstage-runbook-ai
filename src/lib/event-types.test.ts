import { describe, it, expect } from "vitest";
import { EVENT_TYPES, eventTypeOptions, importTypeSelection, importFileProblem, withListedType } from "./event-types";

describe("event type list", () => {
  it("contains the agreed types including Gala / dinner, Awards and Other", () => {
    expect(EVENT_TYPES).toEqual(["Conference","Summit","Corporate event","Panel","Hybrid panel","Gala / dinner","Awards","Product launch","Investor forum","Workshop / training","Executive summit","Other"]);
  });
  it("shows an unlisted stored type as Other: <value>", () => {
    const opts = eventTypeOptions("Healthcare Conference");
    expect(opts.at(-1)).toEqual({ value: "Healthcare Conference", label: "Other: Healthcare Conference" });
    expect(eventTypeOptions("Awards").some((o) => o.label.startsWith("Other:"))).toBe(false);
  });
  it("import preselects a matching type, otherwise Other", () => {
    expect(importTypeSelection("Gala / dinner")).toBe("Gala / dinner");
    expect(importTypeSelection("Healthcare Conference")).toBe("Other");
  });
  it("import mapping stores Other when the AI type is not on the list", () => {
    expect(withListedType({ name: "X", type: "Healthcare Conference" }).type).toBe("Other");
    expect(withListedType({ name: "X", type: "Awards" }).type).toBe("Awards");
  });
  it("import file checks give plain messages", () => {
    expect(importFileProblem("a.docx")).toBeNull();
    expect(importFileProblem("a.doc")).toBe("Save it as .docx and try again.");
    expect(importFileProblem("a.pdf")).toBe("This file type isn't supported. Use .xlsx, .xls, .csv or .docx.");
  });
});
