const PILLARS = [
  {
    label: "Event Planning",
    tile: "bg-navy",
    items: [
      { title: "AI Run Sheet Generator", body: "Minute-by-minute production timelines with transitions, cues, and backstage notes." },
      { title: "Event Templates", body: "Pre-built blueprints for healthcare, executive, awards, launches, and more." },
      { title: "Multi-Day & Multi-Component", body: "Programmes with opening ceremonies, galas, press conferences, exhibitions, and site visits." },
    ],
  },
  {
    label: "Operational Intelligence",
    tile: "bg-accent",
    items: [
      { title: "Smart Review", body: "Pre-show gap analysis flags timing, AV, sponsor, and rehearsal risks." },
      { title: "Event Readiness Score", body: "0–100 score across 10 operational categories with top risks surfaced." },
      { title: "AI Risk Detection", body: "Automatic identification of missing details, tight transitions, and coverage gaps." },
    ],
  },
  {
    label: "Stakeholder Coordination",
    tile: "bg-secondary ring-1 ring-border",
    items: [
      { title: "Speaker Briefings", body: "Arrival, mic type, stage layout, and moderator handoff — ready to copy or export." },
      { title: "Moderator Briefings", body: "Sessions owned, hard in/out timing, sponsor reads, Q&A discipline." },
      { title: "Sponsor Briefings", body: "Activation windows, on-stage acknowledgements, decision-makers in room." },
      { title: "Production Team Briefings", body: "Show-calling detail, mic plot, presets, transitions, contingency." },
    ],
  },
  {
    label: "Event Operations",
    tile: "bg-navy",
    items: [
      { title: "Timeline Management", body: "One integrated schedule across days, components, and parallel activities." },
      { title: "Session Coordination", body: "Speakers, moderators, sponsors, and AV wired to every timeline row." },
      { title: "Operational Alerts", body: "Flags timing conflicts and missing details in your schedule when you review it." },
      { title: "Event Dashboard", body: "Your event at a glance: dates, sessions, people, and parts, with readiness scored on request." },
    ],
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-7xl border-t border-border px-6 py-24 animate-in-up">
      <div className="mb-14 max-w-2xl">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
          Platform Overview
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          Everything a professional event team runs on — coordinated by AI.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          FlowStage replaces spreadsheets, run-of-show documents, and stakeholder briefings with a
          single AI-native platform used by conference teams, event agencies, and corporate
          producers.
        </p>
      </div>

      <div className="space-y-10">
        {PILLARS.map((pillar) => (
          <div key={pillar.label} className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <div className="flex items-start gap-4 lg:flex-col">
              <div className={`size-10 rounded-lg ${pillar.tile}`} />
              <h3 className="text-lg font-semibold text-navy">{pillar.label}</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {pillar.items.map((it) => (
                <div
                  key={it.title}
                  className="lift rounded-xl border border-border bg-background p-5"
                >
                  <p className="text-sm font-semibold text-navy">{it.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Copilot band */}
      <div className="mt-16 rounded-2xl border border-border bg-surface p-8 sm:p-10">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
              AI Event Copilot
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-navy">
              Ask questions. Detect risks. Generate recommendations.
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Conversational access to your entire event plan — sessions, speakers, sponsors,
              readiness, and findings. Ask about coverage gaps, transition risks, or missing
              information and get precise, cited answers.
            </p>
          </div>
          <div className="flex gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-3 py-1">Ask</span>
            <span className="rounded-full border border-border bg-background px-3 py-1">Detect</span>
            <span className="rounded-full border border-border bg-background px-3 py-1">Advise</span>
          </div>
        </div>
      </div>
    </section>
  );
}
