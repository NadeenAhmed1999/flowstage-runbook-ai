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
          <tr
            key={i}
            className={`group transition-colors ${
              r.kind === "break" ? "bg-surface/70" : "hover:bg-accent/[0.03]"
            }`}
          >
            <td className="py-4 pr-4 align-top whitespace-nowrap">
              <div className="font-mono font-semibold tabular text-accent">{r.time}</div>
              <div className="mt-1 font-mono text-[10px] font-normal tabular text-muted-foreground">
                {r.durationMin}′
              </div>
            </td>
            <td className="py-4 pr-4 align-top">
              <div className="font-semibold leading-snug text-foreground">{r.title}</div>
              {r.subtitle && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.subtitle}</p>
              )}
            </td>
            <td className="py-4 pr-4 align-top">
              {r.talent ? (
                <>
                  <p className="font-medium text-foreground">{r.talent}</p>
                  {r.talentSub && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{r.talentSub}</p>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground/60">—</span>
              )}
            </td>
            <td className="py-4 align-top">
              <div className="flex flex-wrap gap-1">
                {r.cues.map((c, idx) => (
                  <span
                    key={idx}
                    className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide transition-colors ${chipClass(c.tone)}`}
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
