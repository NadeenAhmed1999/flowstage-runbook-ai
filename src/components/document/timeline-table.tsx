import type { CueChip, TimelineRow } from "@/lib/run-of-show";

function chipClass(tone: CueChip["tone"]) {
  if (tone === "navy") return "bg-navy text-navy-foreground";
  if (tone === "muted") return "bg-secondary text-muted-foreground ring-1 ring-border";
  return "bg-accent/10 text-accent";
}

export function TimelineTable({ rows }: { rows: TimelineRow[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <th className="py-3 pr-4 font-medium">Time</th>
          <th className="py-3 pr-4 font-medium">Session / Content</th>
          <th className="py-3 pr-4 font-medium">Talent</th>
          <th className="py-3 font-medium">AV & Cues</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60 text-sm">
        {rows.map((r, i) => (
          <tr key={i} className={r.kind === "break" ? "bg-surface" : ""}>
            <td className="py-4 pr-4 align-top font-mono font-medium text-accent whitespace-nowrap">
              {r.time}
              <div className="mt-1 text-[10px] font-normal text-muted-foreground">
                {r.durationMin}′
              </div>
            </td>
            <td className="py-4 pr-4 align-top">
              <div className="font-semibold text-foreground">{r.title}</div>
              {r.subtitle && (
                <p className="mt-1 text-xs text-muted-foreground">{r.subtitle}</p>
              )}
            </td>
            <td className="py-4 pr-4 align-top">
              {r.talent ? (
                <>
                  <p className="font-medium text-foreground">{r.talent}</p>
                  {r.talentSub && (
                    <p className="text-[10px] text-muted-foreground">{r.talentSub}</p>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
            <td className="py-4 align-top">
              <div className="flex flex-wrap gap-1">
                {r.cues.map((c, idx) => (
                  <span
                    key={idx}
                    className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${chipClass(c.tone)}`}
                  >
                    {c.label}
                  </span>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
