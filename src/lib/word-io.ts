import type { EventData } from "@/components/event-context";
import type { RunSheet } from "./run-sheet-parsing";
import type { ParsedWorkbook } from "./excel-io";

/**
 * Read a .docx agenda into the same compact payload shape the AI mapper
 * already understands for spreadsheets: paragraphs become single-cell rows,
 * table rows become multi-cell rows.
 */
export async function parseWordFile(file: File): Promise<ParsedWorkbook> {
  const buf = await file.arrayBuffer();
  // Browser build of mammoth (no Node dependencies).
  const mod: any = await import("mammoth/mammoth.browser.js");
  const mammoth = mod.default ?? mod;
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });

  const doc = new DOMParser().parseFromString(html, "text/html");
  const rows: (string | number | null)[][] = [];

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === "table") {
        for (const tr of Array.from(child.querySelectorAll("tr"))) {
          const cells = Array.from(tr.querySelectorAll("th,td")).map(
            (c) => (c.textContent ?? "").trim(),
          );
          if (cells.some((c) => c)) rows.push(cells);
        }
      } else if (child.children.length && !["p", "li", "h1", "h2", "h3", "h4"].includes(tag)) {
        walk(child);
      } else {
        const text = (child.textContent ?? "").trim();
        if (text) rows.push([text]);
      }
    }
  };
  walk(doc.body);

  return {
    fileName: file.name,
    sheets: [{ name: "Document", rows: rows.slice(0, 500) }],
  };
}

export function isWordFile(file: File) {
  return /\.docx?$/i.test(file.name);
}

/** Export the event (and AI run sheet when available) as a clean .docx download. */
export async function exportEventToWord(event: EventData, runSheet?: RunSheet | null) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    WidthType,
    ShadingType,
    PageOrientation,
  } = await import("docx");

  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const margins = { top: 80, bottom: 80, left: 120, right: 120 };

  const nameOf = (id: string) =>
    event.speakers.find((p) => p.id === id)?.name ??
    event.moderators.find((p) => p.id === id)?.name ??
    "";

  const cell = (text: string, width: number, header = false) =>
    new TableCell({
      borders,
      margins,
      width: { size: width, type: WidthType.DXA },
      shading: header ? { fill: "EEF2F7", type: ShadingType.CLEAR } : undefined,
      children: [
        new Paragraph({ children: [new TextRun({ text: text || "—", bold: header })] }),
      ],
    });

  const table = (widths: number[], head: string[], body: string[][]) =>
    new Table({
      width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
      columnWidths: widths,
      rows: [
        new TableRow({ children: head.map((h, i) => cell(h, widths[i], true)) }),
        ...body.map(
          (r) => new TableRow({ children: r.map((c, i) => cell(c, widths[i])) }),
        ),
      ],
    });

  const heading = (text: string) =>
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });

  const children: any[] = [
    new Paragraph({
      children: [
        new TextRun({ text: "OFFICIAL DOCUMENT // CONFIDENTIAL", size: 16, color: "6B7280" }),
      ],
    }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(event.name)] }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${event.type} · ${event.date}${event.endDate ? ` – ${event.endDate}` : ""}`,
          color: "4B5563",
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  if (runSheet) {
    children.push(
      heading("Production Summary"),
      new Paragraph({ children: [new TextRun(runSheet.productionSummary)] }),
      new Paragraph({ text: "" }),
      heading("Run-of-Show Timeline"),
      table(
        [1100, 800, 3200, 1900, 2360],
        ["Time", "Dur", "Item", "Talent", "Cues"],
        runSheet.timeline.map((b) => [
          b.time,
          `${b.durationMin}m`,
          [b.title, b.subtitle].filter(Boolean).join(" — "),
          b.talent ?? "",
          [...b.cues, b.moderatorCue, b.backstageNote].filter(Boolean).join(" · "),
        ]),
      ),
    );

    const noteSections: [string, { title: string; detail: string }[]][] = [
      ["AV Reminders", runSheet.avReminders],
      ["Backstage Coordination", runSheet.backstageCoordination],
      ["Moderator Cues", runSheet.moderatorCues],
      ["Sponsor Visibility", runSheet.sponsorVisibility],
      ["Networking & Breaks", runSheet.networkingBreaks],
      ["Production Notes", runSheet.productionNotes],
      ["Contingency Reminders", runSheet.contingencyReminders],
    ];
    for (const [title, notes] of noteSections) {
      if (!notes?.length) continue;
      children.push(new Paragraph({ text: "" }), heading(title));
      for (const n of notes) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${n.title}: `, bold: true }),
              new TextRun(n.detail),
            ],
          }),
        );
      }
    }
  } else {
    children.push(
      heading("Agenda"),
      table(
        [700, 1000, 900, 3400, 2300, 1060],
        ["Day", "Start", "Dur", "Session", "Speakers", "Moderators"],
        event.sessions.map((s) => [
          String(s.day ?? 1),
          s.startTime,
          `${s.durationMin}m`,
          s.title,
          s.speakerIds.map(nameOf).filter(Boolean).join(", "),
          s.moderatorIds.map(nameOf).filter(Boolean).join(", "),
        ]),
      ),
    );
  }

  if (event.breaks.length) {
    children.push(
      new Paragraph({ text: "" }),
      heading("Breaks"),
      table(
        [900, 1200, 1200, 6060],
        ["Day", "Start", "Duration", "Label"],
        event.breaks.map((b) => [
          String(b.day ?? 1),
          b.startTime,
          `${b.durationMin}m`,
          b.label,
        ]),
      ),
    );
  }

  if (event.speakers.length || event.moderators.length) {
    children.push(
      new Paragraph({ text: "" }),
      heading("Talent Roster"),
      table(
        [3200, 3200, 2960],
        ["Name", "Role", "Function"],
        [
          ...event.speakers.map((p) => [p.name, p.role, "Speaker"]),
          ...event.moderators.map((p) => [p.name, p.role, "Moderator"]),
        ],
      ),
    );
  }

  if (event.sponsors.length) {
    children.push(
      new Paragraph({ text: "" }),
      heading("Sponsors"),
      table(
        [3600, 5760],
        ["Sponsor", "Placement"],
        event.sponsors.map((s) => [s.name, s.placement]),
      ),
    );
  }

  if (event.components?.length) {
    children.push(
      new Paragraph({ text: "" }),
      heading("Event Components"),
      table(
        [2200, 2800, 700, 900, 900, 1860],
        ["Kind", "Name", "Day", "Start", "Dur", "Venue"],
        event.components.map((c) => [
          c.kind,
          c.name,
          String(c.day ?? 1),
          c.startTime,
          `${c.durationMin}m`,
          c.venue ?? "",
        ]),
      ),
    );
  }

  children.push(
    new Paragraph({ text: "" }),
    heading("AV Requirements"),
    new Paragraph({ children: [new TextRun(event.avRequirements || "—")] }),
    new Paragraph({ text: "" }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Generated by FlowStage · End of document", size: 16, color: "9CA3AF" }),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 20 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 36, bold: true, font: "Arial", color: "1F2A44" },
          paragraph: { spacing: { before: 120, after: 160 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: "1F2A44" },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = event.name.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "flowstage_event";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
