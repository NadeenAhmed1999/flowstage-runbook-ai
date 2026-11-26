/** Exact computed event facts passed to AI prompts so the model never guesses counts or concurrency. */
export type FactSession = { day?: number | undefined; startTime: string; durationMin: number; people?: string[] };

const toMin = (t: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(t.trim()); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };

export function computeEventFacts(sessions: FactSession[]) {
  const days = new Set(sessions.map(s => s.day ?? 1)).size;
  let maxConcurrent = sessions.length ? 1 : 0;
  sessions.forEach((a, i) => {
    const as = toMin(a.startTime); if (as === null) return;
    const overlapping = sessions.filter((b, j) => {
      if (j === i || (b.day ?? 1) !== (a.day ?? 1)) return false;
      const bs = toMin(b.startTime); if (bs === null) return false;
      return bs <= as && as < bs + Math.max(b.durationMin, 1);
    }).length;
    maxConcurrent = Math.max(maxConcurrent, overlapping + 1);
  });
  const speakers = new Set(sessions.flatMap(s => (s.people ?? []).map(p => p.trim().toLowerCase()).filter(Boolean))).size;
  return { days, maxConcurrent, totalSessions: sessions.length, speakers };
}

export function factsBlock(sessions: FactSession[], daysKnown = true): string {
  const f = computeEventFacts(sessions);
  return `\n\nEXACT EVENT FACTS (use only these; never contradict them):
${daysKnown ? `- Days: ${f.days}\n` : ""}- Maximum concurrent tracks in any time block: ${f.maxConcurrent}
- Total sessions: ${f.totalSessions}
- People actually assigned to sessions: ${f.speakers}
Never say sessions run concurrently unless they share a time block. Do not invent counts. Spell all cue text carefully.`;
}
