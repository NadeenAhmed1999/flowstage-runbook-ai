/** AI fallback only: preserve roles before session assignments become plain names. */
export type ImportedPerson = string | { name: string; role?: string };
type RosterPerson = { name: string; role: string };
type PeopleEvent = {
  sessions: { speakers: ImportedPerson[]; moderators: ImportedPerson[] }[];
  speakers: RosterPerson[];
  moderators: RosterPerson[];
};

export function normalizeSessionNames(people: ImportedPerson[]): string[] {
  return people
    .map(person => (typeof person === "string" ? person : person.name).trim())
    .filter(Boolean);
}

export function mergeSessionPersonRoles<T extends { speakers: RosterPerson[]; moderators: RosterPerson[] }>(
  event: T,
  sessions: PeopleEvent["sessions"],
): T {
  const merge = (roster: RosterPerson[], people: ImportedPerson[]) => {
    const merged: RosterPerson[] = [];
    for (const person of [...roster, ...people]) {
      const name = (typeof person === "string" ? person : person.name).trim();
      if (!name) continue;
      const role = typeof person === "string" ? "" : person.role?.trim() ?? "";
      const existing = merged.find(entry => entry.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        if (!existing.role && role) existing.role = role;
      } else {
        merged.push({ name, role });
      }
    }
    return merged;
  };
  return {
    ...event,
    speakers: merge(event.speakers, sessions.flatMap(session => session.speakers)),
    moderators: merge(event.moderators, sessions.flatMap(session => session.moderators)),
  };
}