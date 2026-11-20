import { expect, it } from "vitest";
import * as XLSX from "xlsx";
import { seedEvent } from "@/components/event-context";
import { addPart } from "./parts-edit";
import { buildEventWorkbook, parseWorkbookFile } from "./excel-io";

it("exports separate Part cells and parses original session titles and break labels", async () => {
  const event = addPart(seedEvent, "other", "export-part");
  const sessions = event.sessions.map((s, i) => i === 0 ? { ...s, partId: "part-export-part" } : s);
  const breaks = event.breaks.map((b, i) => i === 0 ? { ...b, partId: "part-export-part" } : b);
  const workbook = buildEventWorkbook({ ...event, sessions, breaks });
  for (const [name, titleKey, originals] of [
    ["Sessions", "Title", sessions.map(s => s.title)],
    ["Breaks", "Label", breaks.map(b => b.label)],
  ] as const) {
    const sheet = workbook.Sheets[name];
    if (!sheet) throw new Error(`Missing ${name}`);
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
    expect(rows.map(row => row[titleKey])).toEqual(originals);
    expect(rows[0]?.["Part"]).toBe("Other part");
    expect(rows.slice(1).every(row => row["Part"] === "")).toBe(true);
  }
  const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const parsed = await parseWorkbookFile(new File([bytes], "anonymous.xlsx"));
  for (const [name, originals] of [["Sessions", sessions.map(s => s.title)], ["Breaks", breaks.map(b => b.label)]] as const) {
    const sheet = parsed.sheets.find(s => s.name === name);
    expect(sheet?.rows.slice(1).map(row => row[3])).toEqual(originals);
    expect(sheet?.rows[0]).not.toContain("Part");
  }
});