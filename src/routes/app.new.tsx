import { useState } from "react";
import { resetSavedEvent } from "@/hooks/use-saved-event";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileSpreadsheet } from "lucide-react";
import {
  useEvent,
  seedEvent,
  type EventData,
  type Person,
  type Sponsor,
} from "@/components/event-context";
import { EVENT_TEMPLATES, applyTemplate, type EventTemplate } from "@/lib/event-templates";
import { eventTypeOptions } from "@/lib/event-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppTopbar } from "@/components/app-shell/topbar";
import { PartsSection } from "@/components/generate/parts-section";

/**
 * Starting-point confirmation rule: the event counts as edited when it differs (by value)
 * from the untouched sample or from the last starting point applied here.
 */
let baselineJson: string | null = null;
function markBaseline(e: EventData) {
  baselineJson = JSON.stringify(e);
}
function isEdited(e: EventData) {
  const now = JSON.stringify(e);
  return now !== JSON.stringify(seedEvent) && now !== baselineJson;
}

export const Route = createFileRoute("/app/new")({
  head: () => ({
    meta: [
      { title: "New event · FlowStage" },
      {
        name: "description",
        content:
          "Input event details, sessions, speakers, breaks, and AV requirements to generate a professional run-of-show document.",
      },
      { property: "og:title", content: "FlowStage Generator" },
      {
        property: "og:description",
        content: "Build a professional run-of-show document in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

function GeneratePage() {
  const { event, setEvent, newId } = useEvent();
  const navigate = useNavigate();

  const [pendingTpl, setPendingTpl] = useState<EventTemplate | null>(null);
  const update = <K extends keyof typeof event>(k: K, v: (typeof event)[K]) =>
    setEvent({ ...event, [k]: v });

  return (
    <>
    <AppTopbar
      breadcrumb="New event"
      title="Set up your event"
      subtitle="Provide the essentials. FlowStage builds the timeline, cues, transitions, and backstage notes from your inputs."
      primary="none"
    />
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="mb-8 flex justify-end">
        <Link
          to="/app/import"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-accent/30 hover:bg-surface"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Import existing event
        </Link>
      </div>
      <form
        className="space-y-10"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/run-of-show" });
        }}
      >
        {/* Templates */}
        <Section title="Starting point" step="00">
          <p className="mb-4 text-sm text-muted-foreground">
            Pre-fills sessions, breaks and sponsors. Choosing one replaces your current event name,
            sessions, breaks, sponsors and parts.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EVENT_TEMPLATES.map((tpl) => {
              const active = event.templateGuidance === tpl.aiGuidance;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    if (isEdited(event)) setPendingTpl(tpl);
                    else {
                      const next = applyTemplate(tpl, event.date, newId);
                      markBaseline(next);
                      setEvent(next);
                      resetSavedEvent();
                    }
                  }}
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
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {tpl.description}
                  </p>
                </button>
              );
            })}
          </div>
          <AlertDialog open={pendingTpl !== null} onOpenChange={(o) => !o && setPendingTpl(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Replace your current event?</AlertDialogTitle>
                <AlertDialogDescription>
                  Using "{pendingTpl?.label}" replaces your event name, sessions, breaks, sponsors
                  and parts. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my event</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (pendingTpl) {
                      const next = applyTemplate(pendingTpl, event.date, newId);
                      markBaseline(next);
                      setEvent(next);
                      resetSavedEvent();
                    }
                    setPendingTpl(null);
                  }}
                >
                  Replace
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                {eventTypeOptions(event.type).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
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
                    endDate: event.endDate && event.endDate < next ? next : event.endDate,
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
                onChange={(e) => update("endDate", e.target.value ? e.target.value : undefined)}
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

        <PartsSection />

        {/* Speakers */}
        <PeopleSection
          step="03"
          title="Speakers"
          people={event.speakers}
          onChange={(ps) => update("speakers", ps)}
          newId={newId}
          placeholderRole="e.g. CTO, Acme"
        />

        {/* Moderators */}
        <PeopleSection
          step="04"
          title="Moderators"
          people={event.moderators}
          onChange={(ps) => update("moderators", ps)}
          newId={newId}
          placeholderRole="e.g. Editor, The Brief"
        />

        {/* Sponsors */}
        <Section
          title="Sponsor Mentions"
          step="05"
          action={
            <button
              type="button"
              onClick={() =>
                update("sponsors", [
                  ...event.sponsors,
                  {
                    id: newId(),
                    name: "New Sponsor",
                    placement: "Opening remarks",
                  } satisfies Sponsor,
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
                  onClick={() =>
                    update(
                      "sponsors",
                      event.sponsors.filter((x) => x.id !== sp.id),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* AV */}
        <Section title="AV Requirements" step="06">
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
              Generate run-of-show →
            </button>
          </div>
        </div>
      </form>
    </div>
    </>
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
          <div className="text-xs font-semibold text-accent hover:underline cursor-pointer">
            {action}
          </div>
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
