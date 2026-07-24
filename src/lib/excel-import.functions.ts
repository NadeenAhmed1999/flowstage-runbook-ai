import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { generateValidatedJSON } from "./ai-json.server";

/**
 * Raw workbook payload sent from the browser after parsing with xlsx.
 * Each sheet is a 2D array of cell values (strings/numbers).
 */
const WorkbookInputSchema = z.object({
  fileName: z.string().max(200),
  sheets: z
    .array(
      z.object({
        name: z.string().max(200),
        rows: z.array(z.array(z.union([z.string(), z.number(), z.null()]))).max(500),
      }),
    )
    .max(20),
});

export type ExcelWorkbookInput = z.infer<typeof WorkbookInputSchema>;

const PersonSchema = z.object({ name: z.string(), role: z.string().default("") });

export const MappedEventSchema = z.object({
  name: z.string(),
  type: z.string().default("Conference"),
  primaryEventType: z.string().default("conference"),
  date: z.string(), // YYYY-MM-DD
  endDate: z.string().optional(),
  sessions: z.array(
    z.object({
      title: z.string(),
      startTime: z.string(), // HH:MM
      durationMin: z.number().int().nonnegative().default(30),
      description: z.string().default(""),
      speakers: z.array(z.string()).default([]),
      moderators: z.array(z.string()).default([]),
      room: z.string().default(""),
      day: z.number().int().min(1).default(1),
    }),
  ),
  breaks: z.array(
    z.object({
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

export type MappedEvent = z.infer<typeof MappedEventSchema>;

export const importEventFromExcel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => WorkbookInputSchema.parse(input))
  .handler(async ({ data }): Promise<MappedEvent> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    // Cap rows/cells per sheet for prompt safety.
    const compact = data.sheets.map((s) => ({
      name: s.name,
      rows: s.rows.slice(0, 200).map((r) =>
        r.slice(0, 20).map((c) => (c === null || c === undefined ? "" : String(c).slice(0, 200))),
      ),
    }));

    const system = `You are an event operations data-mapping engine. You receive raw Excel worksheet contents from a customer migrating an event plan into FlowStage. Your job is to detect and map: sessions, dates, times, speakers, moderators, rooms, breaks, sponsors, event components (ceremonies, galas, receptions, press conferences, awards, etc.), and general notes.

- Detect header rows even when column order varies. Common aliases: "Start", "Time", "From" = startTime. "Session", "Topic", "Title", "Agenda Item" = title. "Speaker(s)", "Presenter" = speakers. "Chair", "Facilitator" = moderators. "Room", "Location", "Venue" = room. "Break", "Coffee", "Lunch", "Networking" rows are breaks. "Sponsor", "Partner" columns = sponsors. Rows tagged Opening/Closing Ceremony, Gala Dinner, Awards, Press Conference, Reception, VIP Dinner, Site Visit = event components (kind = one of: opening-ceremony, closing-ceremony, gala-dinner, awards-ceremony, welcome-reception, networking-reception, vip-dinner, sponsor-exhibition, product-showcase, press-conference, site-visit, celebration-event).
- Normalize times to 24-hour HH:MM. Compute durationMin from start/end when both present, else default 30.
- Normalize dates to YYYY-MM-DD. Detect multi-day events (assign day: 1,2,3...). If a sheet is labelled "Day 2" etc, use that. Set endDate when multi-day.
- Dedupe speakers/moderators into their rosters (name + role if available).
- Put anything you cannot map cleanly into the top-level "notes" field, and list unclear areas in confidence.unclear.
- Set confidence.overall (0-1): 1 = highly confident structural match, 0.5 = partial, <0.4 = user should map manually.
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
      schema: MappedEventSchema,
      system,
      prompt,
      repairInstructions:
        "Return a single JSON object matching the MappedEvent schema exactly. All required fields must be present. Times must be HH:MM strings, dates YYYY-MM-DD.",
      label: "excel-import-mapping",
    });

    return result;
  });
