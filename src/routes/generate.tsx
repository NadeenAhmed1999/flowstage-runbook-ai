import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useEvent,
  type Person,
  type Session,
  type Break,
  type Sponsor,
  type EventComponent,
} from "@/components/event-context";
import { EVENT_TEMPLATES, applyTemplate } from "@/lib/event-templates";
import {
  COMPONENT_BLUEPRINTS,
  COMPONENT_KINDS,
  componentBlueprint,
  type ComponentKind,
} from "@/lib/event-components";


export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [
      { title: "Generate Run-of-Show · FlowStage" },
      {
        name: "description",
        content:
          "Input event details, sessions, speakers, breaks, and AV requirements to generate a professional run-of-show document.",
      },
      { property: "og:title", content: "FlowStage Generator" },
      { property: "og:description", content: "Build a professional run-of-show document in minutes." },
    ],
  }),
  component: GeneratePage,
});

const labelCls = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";
const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function computeDayCount(start: string, end?: string): number {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 1;
  const diff = Math.round((e.getTime() - s.getTime()) / 86_400_000);
  return Math.max(1, diff + 1);
}

function DayPicker({
  value,
  dayCount,
  onChange,
}: {
  value: number | undefined;
  dayCount: number;
  onChange: (day: number) => void;
}) {
  if (dayCount <= 1) return null;
  return (
    <select
      className={inputCls}
      value={value ?? 1}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Day"
    >
      {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
        <option key={d} value={d}>
          Day {d}
        </option>
      ))}
    </select>
  );
}

function GeneratePage() {
  const { event, setEvent, newId } = useEvent();
  const navigate = useNavigate();

  const update = <K extends keyof typeof event>(k: K, v: (typeof event)[K]) =>
    setEvent({ ...event, [k]: v });

  const dayCount = computeDayCount(event.date, event.endDate);
  const multiDay = dayCount > 1;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
            New Document
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy">Configure your event</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Provide the essentials. FlowStage builds the timeline, cues, transitions, and backstage notes
            from your inputs.
          </p>
        </div>
      </div>
      <form
        className="space-y-10"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/run-of-show" });
        }}
      >
        {/* Templates */}
        <Section title="Start from a Template" step="00">
          <p className="mb-4 text-sm text-muted-foreground">
            Choose an event type to pre-fill sessions, breaks, sponsor moments, and AV requirements. Templates also give the
            AI run-sheet generator deeper, event-specific operational context.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EVENT_TEMPLATES.map((tpl) => {
              const active = event.templateGuidance === tpl.aiGuidance;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setEvent(applyTemplate(tpl, event.date, newId))}
                  className={`group text-left rounded-lg border p-4 transition-colors ${
                    active
                      ? "border-accent bg-accent/5"
                      : "border-border bg-surface hover:border-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-navy">{tpl.label}</p>
                    {active && (
                      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-accent">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{tpl.description}</p>
                </button>
              );
            })}
          </div>
        </Section>


        {/* Event basics */}
        <Section title="Event Details" step="01">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <Field label="Event Name">
              <input
                className={inputCls}
                value={event.name}
                onChange={(e) => update("name", e.target.value)}
                maxLength={120}
                required
              />
            </Field>
            <Field label="Type">
              <select
                className={inputCls}
                value={event.type}
                onChange={(e) => update("type", e.target.value)}
              >
                {["Conference", "Summit", "Corporate Event", "Panel", "Hybrid Panel"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Start Date">
              <input
                type="date"
                className={inputCls}
                value={event.date}
                onChange={(e) => {
                  const next = e.target.value;
                  setEvent({
                    ...event,
                    date: next,
                    // Keep endDate >= date
                    endDate:
                      event.endDate && event.endDate < next ? next : event.endDate,
                  });
                }}
              />
            </Field>
            <Field label="End Date (optional)">
              <input
                type="date"
                className={inputCls}
                min={event.date || undefined}
                value={event.endDate ?? ""}
                onChange={(e) =>
                  update("endDate", e.target.value ? e.target.value : undefined)
                }
              />
            </Field>
          </div>
          {(() => {
            const dayCount = computeDayCount(event.date, event.endDate);
            if (dayCount <= 1) return null;
            return (
              <p className="mt-3 text-xs text-muted-foreground">
                Multi-day event detected ({dayCount} days). Assign each session and break to a
                specific day below.
              </p>
            );
          })()}
        </Section>


        {/* Event Components — modular programme blocks */}
        <Section
          title="Event Components"
          step="02"
          action={
            <ComponentAddMenu
              onAdd={(kind) => {
                const bp = componentBlueprint(kind);
                const next: EventComponent = {
                  id: newId(),
                  kind,
                  name: bp.label,
                  day: 1,
                  startTime: bp.defaultStart,
                  durationMin: bp.defaultDurationMin,
                  operationalRequirements: {
                    av: [...bp.defaultAV],
                    staffing: [...bp.defaultStaffing],
                    protocol: [...bp.defaultProtocol],
                  },
                  aiContext: "",
                };
                update("components", [...(event.components ?? []), next]);
              }}
            />
          }
        >
          <p className="mb-4 text-sm text-muted-foreground">
            Add modular programme blocks — Opening Ceremony, Gala Dinner, Awards, Press Conference,
            Site Visits, and more. Each carries its own operational requirements and is woven into
            the AI-generated master run-of-show as part of the same event.
          </p>
          {(event.components ?? []).length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No components added yet. Use <span className="font-semibold text-foreground">+ Add component</span>{" "}
                above to include ceremonies, dinners, receptions, showcases, or off-site visits.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(event.components ?? []).map((c, i) => {
                const bp = componentBlueprint(c.kind);
                return (
                  <div key={c.id} className="rounded-lg border border-border bg-surface p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
                          {bp.category} · {bp.label}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{bp.description}</p>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-medium text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          update(
                            "components",
                            (event.components ?? []).filter((x) => x.id !== c.id),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <div
                      className={`grid gap-3 ${
                        multiDay
                          ? "md:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
                          : "md:grid-cols-[2fr_1fr_1fr_1fr]"
                      }`}
                    >
                      <input
                        className={inputCls}
                        value={c.name}
                        placeholder="Component name"
                        onChange={(e) => {
                          const next = [...(event.components ?? [])];
                          next[i] = { ...c, name: e.target.value };
                          update("components", next);
                        }}
                      />
                      <input
                        type="time"
                        className={inputCls}
                        value={c.startTime}
                        onChange={(e) => {
                          const next = [...(event.components ?? [])];
                          next[i] = { ...c, startTime: e.target.value };
                          update("components", next);
                        }}
                      />
                      <input
                        type="number"
                        min={10}
                        max={720}
                        className={inputCls}
                        value={c.durationMin}
                        onChange={(e) => {
                          const next = [...(event.components ?? [])];
                          next[i] = { ...c, durationMin: Number(e.target.value) };
                          update("components", next);
                        }}
                      />
                      <input
                        className={inputCls}
                        placeholder="Venue (optional)"
                        value={c.venue ?? ""}
                        onChange={(e) => {
                          const next = [...(event.components ?? [])];
                          next[i] = { ...c, venue: e.target.value || undefined };
                          update("components", next);
                        }}
                      />
                      <DayPicker
                        value={c.day}
                        dayCount={dayCount}
                        onChange={(day) => {
                          const next = [...(event.components ?? [])];
                          next[i] = { ...c, day };
                          update("components", next);
                        }}
                      />
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <input
                        type="number"
                        min={0}
                        className={inputCls}
                        placeholder="Expected attendees"
                        value={c.expectedAttendees ?? ""}
                        onChange={(e) => {
                          const next = [...(event.components ?? [])];
                          next[i] = {
                            ...c,
                            expectedAttendees: e.target.value ? Number(e.target.value) : undefined,
                          };
                          update("components", next);
                        }}
                      />
                      <input
                        className={inputCls}
                        placeholder="Hosts (comma-separated)"
                        value={(c.hosts ?? []).join(", ")}
                        onChange={(e) => {
                          const next = [...(event.components ?? [])];
                          const hosts = e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          next[i] = { ...c, hosts: hosts.length ? hosts : undefined };
                          update("components", next);
                        }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      className={`${inputCls} mt-3`}
                      placeholder="AI context — extra operational context the AI should weave into cues (VIP protocol, embargo notes, dress code, sponsor moment, etc.)"
                      value={c.aiContext ?? ""}
                      onChange={(e) => {
                        const next = [...(event.components ?? [])];
                        next[i] = { ...c, aiContext: e.target.value };
                        update("components", next);
                      }}
                    />
                    <details className="mt-3 rounded-md border border-border/60 bg-background p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">
                        Operational requirements (AV · Staffing · Protocol)
                      </summary>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <OpsList
                          label="AV"
                          items={c.operationalRequirements?.av ?? []}
                          onChange={(av) => {
                            const next = [...(event.components ?? [])];
                            next[i] = {
                              ...c,
                              operationalRequirements: { ...c.operationalRequirements, av },
                            };
                            update("components", next);
                          }}
                        />
                        <OpsList
                          label="Staffing"
                          items={c.operationalRequirements?.staffing ?? []}
                          onChange={(staffing) => {
                            const next = [...(event.components ?? [])];
                            next[i] = {
                              ...c,
                              operationalRequirements: { ...c.operationalRequirements, staffing },
                            };
                            update("components", next);
                          }}
                        />
                        <OpsList
                          label="Protocol"
                          items={c.operationalRequirements?.protocol ?? []}
                          onChange={(protocol) => {
                            const next = [...(event.components ?? [])];
                            next[i] = {
                              ...c,
                              operationalRequirements: { ...c.operationalRequirements, protocol },
                            };
                            update("components", next);
                          }}
                        />
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </Section>


        {/* Sessions */}
        <Section
          title="Sessions"
          step="03"
          action={
            <button
              type="button"
              onClick={() =>
                update("sessions", [
                  ...event.sessions,
                  {
                    id: newId(),
                    title: "New Session",
                    startTime: "12:00",
                    durationMin: 30,
                    description: "",
                    speakerIds: [],
                    moderatorIds: [],
                  } satisfies Session,
                ])
              }
            >
              + Add session
            </button>
          }
        >
          <div className="space-y-4">
            {event.sessions.map((s, i) => (
              <div key={s.id} className="rounded-lg border border-border bg-surface p-4">
                <div
                  className={`grid gap-3 ${
                    multiDay
                      ? "md:grid-cols-[2fr_1fr_1fr_1fr_auto]"
                      : "md:grid-cols-[2fr_1fr_1fr_auto]"
                  }`}
                >
                  <input
                    className={inputCls}
                    value={s.title}
                    placeholder="Session title"
                    onChange={(e) => {
                      const next = [...event.sessions];
                      next[i] = { ...s, title: e.target.value };
                      update("sessions", next);
                    }}
                  />
                  <input
                    type="time"
                    className={inputCls}
                    value={s.startTime}
                    onChange={(e) => {
                      const next = [...event.sessions];
                      next[i] = { ...s, startTime: e.target.value };
                      update("sessions", next);
                    }}
                  />
                  <input
                    type="number"
                    min={5}
                    max={480}
                    className={inputCls}
                    value={s.durationMin}
                    onChange={(e) => {
                      const next = [...event.sessions];
                      next[i] = { ...s, durationMin: Number(e.target.value) };
                      update("sessions", next);
                    }}
                  />
                  <DayPicker
                    value={s.day}
                    dayCount={dayCount}
                    onChange={(day) => {
                      const next = [...event.sessions];
                      next[i] = { ...s, day };
                      update("sessions", next);
                    }}
                  />
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      update(
                        "sessions",
                        event.sessions.filter((x) => x.id !== s.id),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Short description for cue logic"
                  className={`${inputCls} mt-3`}
                  value={s.description}
                  onChange={(e) => {
                    const next = [...event.sessions];
                    next[i] = { ...s, description: e.target.value };
                    update("sessions", next);
                  }}
                />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <PeopleSelect
                    label="Speakers"
                    options={event.speakers}
                    selected={s.speakerIds}
                    onChange={(ids) => {
                      const next = [...event.sessions];
                      next[i] = { ...s, speakerIds: ids };
                      update("sessions", next);
                    }}
                  />
                  <PeopleSelect
                    label="Moderators"
                    options={event.moderators}
                    selected={s.moderatorIds}
                    onChange={(ids) => {
                      const next = [...event.sessions];
                      next[i] = { ...s, moderatorIds: ids };
                      update("sessions", next);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Speakers */}
        <PeopleSection
          step="04"
          title="Speakers"
          people={event.speakers}
          onChange={(ps) => update("speakers", ps)}
          newId={newId}
          placeholderRole="e.g. CTO, Acme"
        />

        {/* Moderators */}
        <PeopleSection
          step="05"
          title="Moderators"
          people={event.moderators}
          onChange={(ps) => update("moderators", ps)}
          newId={newId}
          placeholderRole="e.g. Editor, The Brief"
        />

        {/* Breaks */}
        <Section
          title="Networking Breaks"
          step="06"
          action={
            <button
              type="button"
              onClick={() =>
                update("breaks", [
                  ...event.breaks,
                  { id: newId(), label: "Break", startTime: "12:00", durationMin: 20 } satisfies Break,
                ])
              }
            >
              + Add break
            </button>
          }
        >
          <div className="space-y-3">
            {event.breaks.map((b, i) => (
              <div
                key={b.id}
                className={`grid gap-3 ${
                  multiDay
                    ? "md:grid-cols-[2fr_1fr_1fr_1fr_auto]"
                    : "md:grid-cols-[2fr_1fr_1fr_auto]"
                }`}
              >
                <input
                  className={inputCls}
                  value={b.label}
                  onChange={(e) => {
                    const next = [...event.breaks];
                    next[i] = { ...b, label: e.target.value };
                    update("breaks", next);
                  }}
                />
                <input
                  type="time"
                  className={inputCls}
                  value={b.startTime}
                  onChange={(e) => {
                    const next = [...event.breaks];
                    next[i] = { ...b, startTime: e.target.value };
                    update("breaks", next);
                  }}
                />
                <input
                  type="number"
                  className={inputCls}
                  value={b.durationMin}
                  onChange={(e) => {
                    const next = [...event.breaks];
                    next[i] = { ...b, durationMin: Number(e.target.value) };
                    update("breaks", next);
                  }}
                />
                <DayPicker
                  value={b.day}
                  dayCount={dayCount}
                  onChange={(day) => {
                    const next = [...event.breaks];
                    next[i] = { ...b, day };
                    update("breaks", next);
                  }}
                />
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground hover:text-destructive"
                  onClick={() => update("breaks", event.breaks.filter((x) => x.id !== b.id))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Sponsors */}
        <Section
          title="Sponsor Mentions"
          step="07"
          action={
            <button
              type="button"
              onClick={() =>
                update("sponsors", [
                  ...event.sponsors,
                  { id: newId(), name: "New Sponsor", placement: "Opening remarks" } satisfies Sponsor,
                ])
              }
            >
              + Add sponsor
            </button>
          }
        >
          <div className="space-y-3">
            {event.sponsors.map((sp, i) => (
              <div key={sp.id} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                <input
                  className={inputCls}
                  value={sp.name}
                  onChange={(e) => {
                    const next = [...event.sponsors];
                    next[i] = { ...sp, name: e.target.value };
                    update("sponsors", next);
                  }}
                />
                <input
                  className={inputCls}
                  value={sp.placement}
                  placeholder="Where to mention"
                  onChange={(e) => {
                    const next = [...event.sponsors];
                    next[i] = { ...sp, placement: e.target.value };
                    update("sponsors", next);
                  }}
                />
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground hover:text-destructive"
                  onClick={() => update("sponsors", event.sponsors.filter((x) => x.id !== sp.id))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* AV */}
        <Section title="AV Requirements" step="08">
          <textarea
            rows={4}
            className={inputCls}
            value={event.avRequirements}
            onChange={(e) => update("avRequirements", e.target.value)}
            placeholder="Microphones, screens, lighting notes, walk-on music…"
          />
        </Section>

        {/* Sticky CTA */}
        <div className="sticky bottom-0 -mx-6 border-t border-border bg-background/90 px-6 py-4 backdrop-blur-md no-print">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
            <button
              type="submit"
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-colors"
            >
              Generate Run-of-Show →
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  step,
  action,
  children,
}: {
  title: string;
  step: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            STEP {step}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-navy">{title}</h2>
        </div>
        {action && (
          <div className="text-xs font-semibold text-accent hover:underline cursor-pointer">{action}</div>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function PeopleSection({
  step,
  title,
  people,
  onChange,
  newId,
  placeholderRole,
}: {
  step: string;
  title: string;
  people: Person[];
  onChange: (next: Person[]) => void;
  newId: () => string;
  placeholderRole: string;
}) {
  return (
    <Section
      title={title}
      step={step}
      action={
        <button
          type="button"
          onClick={() => onChange([...people, { id: newId(), name: "", role: "" }])}
        >
          + Add {title.toLowerCase().slice(0, -1)}
        </button>
      }
    >
      <div className="space-y-3">
        {people.map((p, i) => (
          <div key={p.id} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              className={inputCls}
              value={p.name}
              placeholder="Full name"
              onChange={(e) => {
                const next = [...people];
                next[i] = { ...p, name: e.target.value };
                onChange(next);
              }}
            />
            <input
              className={inputCls}
              value={p.role}
              placeholder={placeholderRole}
              onChange={(e) => {
                const next = [...people];
                next[i] = { ...p, role: e.target.value };
                onChange(next);
              }}
            />
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-destructive"
              onClick={() => onChange(people.filter((x) => x.id !== p.id))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PeopleSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Person[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div>
      <p className={`${labelCls} mb-2`}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Add people above</span>
        )}
        {options.map((o) => {
          const active = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() =>
                onChange(active ? selected.filter((x) => x !== o.id) : [...selected, o.id])
              }
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {o.name || "Untitled"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ComponentAddMenu({ onAdd }: { onAdd: (kind: ComponentKind) => void }) {
  const grouped = COMPONENT_KINDS.reduce<Record<string, ComponentKind[]>>((acc, k) => {
    const bp = COMPONENT_BLUEPRINTS[k];
    (acc[bp.category] ??= []).push(k);
    return acc;
  }, {});
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-md border border-accent/40 bg-accent/5 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/10">
        + Add component
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-border bg-background p-3 shadow-lg">
        {Object.entries(grouped).map(([cat, kinds]) => (
          <div key={cat} className="mb-3 last:mb-0">
            <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {cat}
            </p>
            <div className="grid gap-1">
              {kinds.map((k) => {
                const bp = COMPONENT_BLUEPRINTS[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={(e) => {
                      onAdd(k);
                      // close <details> after selection
                      const details = (e.currentTarget.closest("details") as HTMLDetailsElement) ?? null;
                      if (details) details.open = false;
                    }}
                    className="rounded-md border border-transparent px-2 py-1.5 text-left text-xs text-foreground hover:border-border hover:bg-surface"
                  >
                    <span className="font-semibold">{bp.label}</span>
                    <span className="ml-2 text-muted-foreground">{bp.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function OpsList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div>
      <p className={`${labelCls} mb-1.5`}>{label}</p>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              className={inputCls}
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              aria-label={`Remove ${label} item`}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-xs font-medium text-accent hover:underline"
          onClick={() => onChange([...items, ""])}
        >
          + Add {label.toLowerCase()} item
        </button>
      </div>
    </div>
  );
}
