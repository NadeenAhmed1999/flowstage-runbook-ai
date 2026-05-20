export function FeatureGrid() {
  const features = [
    {
      title: "Automated Timecoding",
      body: "Propagate timing changes instantly across the entire timeline. No more manual math on cue sheets.",
      tile: "bg-navy",
      inner: "size-4 bg-background rounded-xs",
    },
    {
      title: "AV Orchestration",
      body: "Structured metadata for lighting cues, audio presets, and camera shots — formatted for stage crew.",
      tile: "bg-accent",
      inner: "size-4 bg-background/40 rounded-full",
    },
    {
      title: "Talent Briefing",
      body: "Generate personalized cue sheets for speakers and moderators with a single click.",
      tile: "bg-secondary ring-1 ring-border",
      inner: "size-4 bg-navy/20 rounded-xs rotate-45",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl border-t border-border px-6 py-24 animate-in-up">
      <div className="grid gap-12 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="space-y-4">
            <div className={`size-10 rounded-lg flex items-center justify-center ${f.tile}`}>
              <div className={f.inner} />
            </div>
            <h4 className="font-semibold text-navy">{f.title}</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
