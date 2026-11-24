import { EVENT_TYPES } from "@/lib/event-types";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { generateValidatedJSON } from "./ai-json.server";
import { parseAgendaWorkbook, rankSheets } from "./import/agenda-parse";
import { mergeSessionPersonRoles, normalizeSessionNames } from "./import/session-people";

/**
 * Raw workbook payload sent from the browser after parsing with xlsx.
 * Each sheet is a 2D array of cell values (strings/numbers).
 */
const WorkbookInputSchema = z.object({
  fileName: z.string().max(200),
  forceAi: z.boolean().optional(),
  sheets: z
    .array(
      z.object({
        name: z.string().max(200),
        rows: z.array(z.array(z.union([z.string(), z.number(), z.null()]))).transform((rows) => rows.slice(0, 500)),
      }),
    )
    .max(60),
});

export type ExcelWorkbookInput = z.infer<typeof WorkbookInputSchema>;

const Provenance = {
  durationSource: z.enum(["provided", "derived", "inferred"]).optional(),
  inferredDay: z.boolean().optional(),
  /** AI fallback omitted the day even after retries; shown on Day 1 with a review warning. */
  dayMissing: z.boolean().optional(),
};

const PersonSchema = z.object({ name: z.string(), role: z.string().default("") });

const SessionPersonSchema = z.union([
  z.string().transform(name => name.trim()),
  z.object({ name: z.string().transform(name => name.trim()), role: z.string().optional() }),
]).catch(""); // Ignore nulls, nameless objects and other unusable assignments.

const MappedEventInputSchema = z.object({
  importReview: z.object({
    year: z.number().nullable(),
    dayDates: z.array(z.object({ day: z.number(), month: z.number(), dateDay: z.number() })),
    skippedSheets: z.array(z.string()),
    inferredEvent: z.boolean(),
  }).optional(),
  name: z.string(),
  type: z.string().default("Other"),
  primaryEventType: z.string().optional(),
  date: z.string().default(""), // YYYY-MM-DD, or empty when unknown
  endDate: z.string().optional(),
  sessions: z.array(
    z.object({
      ...Provenance,
      sessionType: z.string().optional(),
      inferredType: z.boolean().optional(),
      title: z.string(),
      startTime: z.string(), // HH:MM
      durationMin: z.number().int().nonnegative().default(30),
      description: z.string().default(""),
      speakers: z.array(SessionPersonSchema).default([]),
      moderators: z.array(SessionPersonSchema).default([]),
      room: z.string().default(""),
      day: z.number().int().min(1).default(1),
    }),
  ),
  breaks: z.array(
    z.object({
      ...Provenance,
      label: z.string(),
      startTime: z.string(),
      durationMin: z.number().int().nonnegative().default(15),
      day: z.number().int().min(1).default(1),
    }),
  ),
  speakers: z.array(PersonSchema).default([]),
  moderators: z.array(PersonSchema).default([]),
  sponsors: z
    .array(z.object({ name: z.string(), placement: z.string().default("") }))
    .default([]),
  components: z
    .array(
      z.object({
        kind: z.string().default("opening-ceremony"),
        dayMissing: z.boolean().optional(),
        name: z.string(),
        day: z.number().int().min(1).default(1),
        startTime: z.string().default("09:00"),
        durationMin: z.number().int().nonnegative().default(30),
        venue: z.string().default(""),
        notes: z.string().default(""),
      }),
    )
    .default([]),
  notes: z.string().default(""),
  avRequirements: z.string().default(""),
  confidence: z.object({
    overall: z.number().min(0).max(1),
    unclear: z.array(z.string()).default([]),
  }),
});

export const MappedEventSchema = MappedEventInputSchema.transform(mapped => ({
  ...mapped,
  sessions: mapped.sessions.map(session => ({
    ...session,
    speakers: normalizeSessionNames(session.speakers),
    moderators: normalizeSessionNames(session.moderators),
  })),
}));
const DAY_LISTS = ["sessions", "breaks", "components"] as const;
const hasDay = (item: unknown) => { const day = (item as { day?: unknown } | null)?.day; return typeof day === "number" && Number.isInteger(day) && day >= 1; };
/** Paths of AI rows without a usable day number. */
export function missingDayPaths(raw: unknown): (string | number)[][] {
  if (!raw || typeof raw !== "object") return [];
  return DAY_LISTS.flatMap(list => { const items = (raw as Record<string, unknown>)[list]; return Array.isArray(items) ? items.flatMap((item, i) => hasDay(item) ? [] : [[list, i, "day"]]) : []; });
}
/** Final-attempt fallback: keep rows, place them on Day 1 and flag them for a review warning. */
export function markMissingDays(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const out: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
  for (const list of DAY_LISTS) { const items = out[list]; if (Array.isArray(items)) out[list] = items.map(item => hasDay(item) || !item || typeof item !== "object" ? item : { ...item, day: 1, dayMissing: true }); }
  return out;
}
const withRoles = (mapped: z.infer<typeof MappedEventInputSchema>) => mergeSessionPersonRoles(MappedEventSchema.parse(mapped), mapped.sessions);
// AI fallback: every session/break/component must carry its day, so omissions fail validation and retry.
export const AiFallbackMappedEventSchema = z.unknown().superRefine((raw, ctx) => {
  for (const path of missingDayPaths(raw)) ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: "day Required: use the day number of the dated heading this row appears under" });
}).pipe(MappedEventInputSchema).transform(withRoles);
/** Used only after the final retry still omits days. */
export const AiFallbackLenientSchema = z.preprocess(markMissingDays, MappedEventInputSchema).transform(withRoles);

export type MappedEvent = z.infer<typeof MappedEventSchema>;

export const importEventFromExcel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => WorkbookInputSchema.parse(input))
  .handler(async ({ data }): Promise<MappedEvent> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI gateway not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    // Deterministic first pass; the AI only names/types the event and flags break rows.
    const draft = data.forceAi ? null : parseAgendaWorkbook(data.fileName, data.sheets);
    if (draft) return refineDraft(model, data.fileName, draft.mapped);

    // No agenda header: existing AI mapping, limited to the 20 most agenda-like sheets.
    const ranked = rankSheets(data.sheets).slice(0, 20).sort((a, b) => a.index - b.index);
    const chosen = ranked.flatMap((r) => { const sheet = data.sheets[r.index]; return sheet ? [sheet] : []; });

    // Cap rows/cells per sheet for prompt safety.
    const compact = chosen.map((s) => ({
      name: s.name,
      rows: s.rows.slice(0, 200).map((r) =>
        r.slice(0, 20).map((c) => (c === null || c === undefined ? "" : String(c).slice(0, 200))),
      ),
    }));

    const system = `You are an event operations data-mapping engine. You receive raw worksheet contents or Word agenda text from a customer migrating an event plan into FlowStage. Your job is to detect and map: sessions, dates, times, speakers, moderators, rooms, breaks, sponsors, event components (ceremonies, galas, receptions, press conferences, awards, etc.), and general notes.

- Detect header rows even when column order varies. Common aliases: "Start", "Time", "From" = startTime. "Session", "Topic", "Title", "Agenda Item" = title. "Speaker(s)", "Presenter" = speakers. "Chair", "Facilitator" = moderators. "Room", "Location", "Venue" = room. "Break", "Coffee", "Lunch", "Networking" rows are breaks. "Sponsor", "Partner" columns = sponsors. Rows tagged Opening/Closing Ceremony, Gala Dinner, Awards, Press Conference, Reception, VIP Dinner, Site Visit = event components (kind = one of: opening-ceremony, closing-ceremony, gala-dinner, awards-ceremony, welcome-reception, networking-reception, vip-dinner, sponsor-exhibition, product-showcase, press-conference, site-visit, celebration-event).
- Normalize times to 24-hour HH:MM. Compute durationMin from start/end when both present, else default 30.
- Normalize dates to YYYY-MM-DD. Detect multi-day events (assign day: 1,2,3...). If a sheet is labelled "Day 2" etc, use that. Set endDate when multi-day.
- EVERY session, break (including coffee breaks and lunches) and component MUST carry "day": the day index of the dated heading it appears under, counted within the event's date range. Example: for an event running 01-03 December 2026, rows under "Wednesday, 02 December 2026" are day 2 and rows under "Thursday, 03 December 2026" are day 3 (01 December is day 1, even when it has no rows). Never omit day and never default it to 1.
- Dates often appear in headings such as "Wednesday, 02 December 2026" or "01-03 December 2026". Use a dated heading as that day's date; use a range's first date for date and last date for endDate. If no date is supplied, return date: "" and flag the missing date in confidence.unclear; never invent a date or year.
- Text lines like "09:00–09:30 Opening Remarks" contain start time, end time and title; derive durationMin from the time range.
- "Session Chair(s)" are moderators; "Speaker(s)" and "Proposed Speaker(s)" are speakers. Bracketed confirmed/invited/TBC labels are status, not names or roles: drop them. Ignore email addresses. Split a person line "Name, Title, Org" into name and role (retain Title and Org in role).
- Dedupe speakers/moderators into their rosters (name + role if available).
- sessions[].speakers and sessions[].moderators must be arrays of plain name STRINGS, never objects. Roles go only in the top-level speakers/moderators rosters as {name, role}.
- Do not turn "Overview", "Description", or "Learning Objectives" text into sessions; put that text in the relevant session's description.
- Put anything you cannot map cleanly into the top-level "notes" field, and list unclear areas in confidence.unclear.
- Set confidence.overall (0-1): 1 = highly confident structural match, 0.5 = partial, <0.4 = user should map manually.
- Event type: "type" must be exactly one value from this list, or Other: ${EVENT_TYPES.join(", ")}. Return only that value.
- If the event name is not obvious, use the file name (minus extension) as a fallback.`;

    const prompt = `File: ${data.fileName}

Worksheets:
${compact
  .map(
    (s) =>
      `--- Sheet: ${s.name} (${s.rows.length} rows) ---\n${s.rows
        .map((r, i) => `${i}: ${JSON.stringify(r)}`)
        .join("\n")}`,
  )
  .join("\n\n")}`;

    const result = await generateValidatedJSON({
      model,
      schema: AiFallbackMappedEventSchema,
      system,
      prompt,
      repairInstructions:
        "Return a single JSON object matching the MappedEvent schema exactly. All required fields must be present, including day on every session, break and component. Times must be HH:MM strings, dates YYYY-MM-DD or an empty string when unknown.",
      label: "excel-import-mapping",
      fallbackSchema: AiFallbackLenientSchema,
    });

    return result;
  });

const RefineSchema = z.object({
  name: z.string(),
  type: z.string(),
  breakRows: z.array(z.number().int()).default([]),
});

async function refineDraft(
  model: Parameters<typeof generateValidatedJSON>[0]["model"],
  fileName: string,
  mapped: MappedEvent,
): Promise<MappedEvent> {
  const rows = mapped.sessions.slice(0, 120).map((s, i) => `${i}: ${s.title.slice(0, 120)}${s.description ? ` | ${s.description.slice(0, 80)}` : ""}`);
  try {
    const r = await generateValidatedJSON({
      model,
      schema: RefineSchema,
      system: `You label an already-parsed event agenda. Return JSON {name, type, breakRows}. name: the event name from the file name or title, without the year if it is only a date. type: exactly one of ${EVENT_TYPES.join(", ")}, or Other. breakRows: indexes of rows that are breaks, meals, registration or networking rather than programme sessions. Do not invent anything.`,
      prompt: `File: ${fileName}\nTitle guess: ${mapped.name}\nRows:\n${rows.join("\n")}`,
      repairInstructions: "Return one JSON object with name (string), type (string), breakRows (integer array).",
      label: "excel-import-refine",
    });
    const breakSet = new Set(r.breakRows.filter((i) => i >= 0 && i < mapped.sessions.length));
    return {
      ...mapped,
      name: r.name.trim() || mapped.name,
      type: (EVENT_TYPES as readonly string[]).includes(r.type) ? r.type : "Other",
      sessions: mapped.sessions.filter((_, i) => !breakSet.has(i)),
      breaks: [
        ...mapped.breaks,
        ...mapped.sessions.filter((_, i) => breakSet.has(i)).map((s) => ({ label: s.title, startTime: s.startTime, durationMin: s.durationMin, day: s.day, ...(s.durationSource ? { durationSource: s.durationSource } : {}), ...(s.inferredDay !== undefined ? { inferredDay: s.inferredDay } : {}) })),
      ],
    };
  } catch {
    return { ...mapped, confidence: { ...mapped.confidence, unclear: [...mapped.confidence.unclear, "Event name and type could not be suggested automatically."] } };
  }
}
