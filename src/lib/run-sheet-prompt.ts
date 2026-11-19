import type { z } from "zod";
import type { RunSheetInputSchema } from "./run-sheet-parsing";

/** Builds the user prompt for run-sheet generation. Pure so it can be tested character for character. */
export function buildRunSheetPrompt(data: z.infer<typeof RunSheetInputSchema>): string {
    const isMultiDay = Boolean(data.eventEndDate && data.eventEndDate !== data.eventDate);
    const dayCount = isMultiDay
      ? Math.max(
          1,
          ...data.sessions.map((s) => s.day ?? 1),
          ...data.breaks.map((b) => b.day ?? 1),
        )
      : 1;

    const sessionsByDay = Array.from({ length: dayCount }, (_, i) => i + 1)
      .map((d) => {
        const lines =
          data.sessions
            .filter((s) => (s.day ?? 1) === d)
            .map(
              (s) =>
                `- ${s.startTime} (${s.durationMin}min) ${s.title}
  Speakers: ${s.speakers.join(", ") || "—"}
  Moderators: ${s.moderators.join(", ") || "—"}
  ${s.description ?? ""}`,
            )
            .join("\n") || "- (no sessions)";
        return isMultiDay ? `\n=== DAY ${d} ===\n${lines}` : lines;
      })
      .join("\n");

    const breaksByDay = Array.from({ length: dayCount }, (_, i) => i + 1)
      .map((d) => {
        const lines =
          data.breaks
            .filter((b) => (b.day ?? 1) === d)
            .map((b) => `- ${b.startTime} (${b.durationMin}min) ${b.label}`)
            .join("\n") || "- None";
        return isMultiDay ? `\n=== DAY ${d} ===\n${lines}` : lines;
      })
      .join("\n");

    const componentsBlock =
      data.components && data.components.length > 0
        ? `\nEVENT COMPONENTS (modular programme blocks — treat each as a first-class part of the same multi-day event, not a separate event):\n${data.components
            .map(
              (c) =>
                `- [${c.label}] "${c.name}" · Day ${c.day ?? 1} · ${c.startTime} · ${c.durationMin}min${c.venue ? ` · ${c.venue}` : ""}${c.expectedAttendees ? ` · ${c.expectedAttendees} pax` : ""}
  Hosts: ${(c.hosts ?? []).join(", ") || "—"}
  Speakers: ${(c.speakers ?? []).join(", ") || "—"}
  AV: ${(c.av ?? []).join("; ") || "—"}
  Staffing: ${(c.staffing ?? []).join("; ") || "—"}
  Protocol: ${(c.protocol ?? []).join("; ") || "—"}
  Guidance: ${c.aiPromptSnippet ?? ""}${c.aiContext ? ` // ${c.aiContext}` : ""}`,
            )
            .join("\n")}\n\nFor every component above, weave the correct operational workflow (AV cues, protocol notes, staffing calls, production cues, contingencies) into the master timeline in chronological order across the whole event. Label the relevant timeline rows with the component's name in the subtitle.`
        : "";

    return `Generate a production-ready run-of-show document for the following event:

EVENT: ${data.eventName}
TYPE: ${data.eventType}
DATE: ${data.eventDate}${isMultiDay ? ` → ${data.eventEndDate} (${dayCount}-day program)` : ""}

SESSIONS:
${sessionsByDay}

BREAKS:
${breaksByDay}
${componentsBlock}
SPONSORS:
${data.sponsors.map((s) => `- ${s.name} — ${s.placement}`).join("\n") || "None"}

AV REQUIREMENTS:
${data.avRequirements || "Standard conference AV"}
${data.templateGuidance ? `\nEVENT-TYPE GUIDANCE (apply throughout the document):\n${data.templateGuidance}\n` : ""}
${data.operationsBrief ? `\nOPERATIONAL MODEL (authoritative — venue, rooms, concurrent tracks, setup/reset, requirements, resources, detected conflicts and NOT SPECIFIED gaps; reason across the whole event, never invent unspecified details):\n${data.operationsBrief}\n` : ""}
Produce the complete document. ${
      isMultiDay
        ? `This is a ${dayCount}-day program. Build the timeline day-by-day with a clear "DAY 1", "DAY 2"… header before each day's blocks. Each day starts 30 minutes before its first session with house open, includes explicit transition blocks between every session, and ends with a wrap/closeout for that day. Add an end-of-day reset / overnight handoff note where appropriate.`
        : `Make sure the timeline starts 30 minutes before the first session with house open, includes explicit transition blocks between every session, and ends with a closeout block.`
    }`;
}
