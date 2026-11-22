import type { EventData } from "@/components/event-context";
import { resolveOps } from "@/lib/event-migrate";
import { isPause } from "@/lib/event-model";

/** Read-only roster and assignments; organisation is never inferred from a name or role. */
export function talentSummary(event: EventData) {
  const ops = resolveOps(event);
  const items = ops.items.filter(item => !isPause(item));
  const speakerIds = new Set([...event.speakers.map(person => person.id), ...items.flatMap(item => item.speakers.value ?? [])]);
  const moderatorIds = new Set([...event.moderators.map(person => person.id), ...items.flatMap(item => [...(item.moderators.value ?? []), ...(item.chairs.value ?? [])])]);
  const roster = [...new Map(ops.people.map(person => [person.id, person])).values()];
  const people = roster.filter(person => speakerIds.has(person.id) || moderatorIds.has(person.id)).map(person => {
    const duties = [speakerIds.has(person.id) ? "Speaker" : "", moderatorIds.has(person.id) ? "Moderator" : ""].filter(Boolean);
    const organisation = person.organisation ?? event.ops?.people.find(original => original.id === person.id)?.organisation;
    return {
      id: person.id, name: person.name, role: person.role, organisation, duties,
      sessions: items.filter(item => [...(item.speakers.value ?? []), ...(item.moderators.value ?? []), ...(item.chairs.value ?? [])].includes(person.id))
        .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
        .map(item => ({ id: item.id, title: item.title, day: item.day, start: item.start, end: item.end,
          partName: ops.parts.length > 1 ? ops.parts.find(part => part.id === item.partId)?.name : undefined })),
    };
  });
  const knownSpeakers = new Set(people.filter(person => person.duties.includes("Speaker")).map(person => person.id));
  return {
    people,
    speakers: knownSpeakers.size,
    moderators: people.filter(person => person.duties.includes("Moderator")).length,
    sessionsWithoutSpeaker: event.sessions.filter(session => {
      const item = items.find(item => item.id === session.id || item.origin?.id === session.id);
      return !(item?.speakers.value ?? session.speakerIds).some(id => knownSpeakers.has(id));
    }).length,
  };
}
