/** The single list of event types used across setup, import review and the import AI. */
export const EVENT_TYPES = [
  "Conference",
  "Summit",
  "Corporate event",
  "Panel",
  "Hybrid panel",
  "Gala / dinner",
  "Awards",
  "Product launch",
  "Investor forum",
  "Workshop / training",
  "Executive summit",
  "Other",
] as const;

export type EventTypeName = (typeof EVENT_TYPES)[number];

export function isListedEventType(v: string): v is EventTypeName {
  return (EVENT_TYPES as readonly string[]).includes(v);
}

/** Options for a Type select. A stored value not on the list is kept as "Other: <value>", never swapped for another type. */
export function eventTypeOptions(stored: string): { value: string; label: string }[] {
  const opts = EVENT_TYPES.map((t) => ({ value: t as string, label: t as string }));
  if (stored && !isListedEventType(stored)) opts.push({ value: stored, label: `Other: ${stored}` });
  return opts;
}

/** Import review: preselect the AI type when it matches the list, otherwise "Other". */
export function importTypeSelection(aiType: string): EventTypeName {
  return isListedEventType(aiType) ? aiType : "Other";
}

/** Import file check. Returns a plain message, or null when the file is allowed. */
export function importFileProblem(fileName: string): string | null {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  if (["xlsx", "xls", "csv", "docx"].includes(ext) && fileName.includes(".")) return null;
  if (ext === "doc") return "Save it as .docx and try again.";
  return "This file type isn't supported. Use .xlsx, .xls, .csv or .docx.";
}
