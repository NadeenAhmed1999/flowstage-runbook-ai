import { useState, type ReactNode } from "react";
import { ArrowUp, ArrowDown, Trash2, Copy } from "lucide-react";
import {
  useEvent,
  type EventComponent,
  type Session,
  type Break,
  type Person,
} from "@/components/event-context";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { COMPONENT_KINDS, componentBlueprint, type ComponentKind } from "@/lib/event-components";
import { MAIN_PART_ID, componentPartId } from "@/lib/event-parts";
import {
  addPart,
  editPart,
  renameMainPart,
  reorderPart,
  deletePart,
  partItemCounts,
} from "@/lib/parts-edit";
import { fromMin, toMin } from "@/lib/event-model";

const input =
  "w-full min-w-0 min-h-11 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground";
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Checklist({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        className={input}
        rows={3}
        value={values.join("\n")}
        onChange={(e) => onChange(e.target.value ? e.target.value.split("\n") : [])}
        placeholder="One item per line"
      />
    </Field>
  );
}
function PeoplePicker({
  label,
  people,
  ids,
  onChange,
}: {
  label: string;
  people: Person[];
  ids: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {!people.length && (
          <p className="text-sm text-muted-foreground">
            No {label.toLowerCase()} yet. Add them to the shared list below.
          </p>
        )}
        {people.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant={ids.includes(p.id) ? "secondary" : "outline"}
            className="min-h-11 h-auto max-w-full whitespace-normal"
            aria-pressed={ids.includes(p.id)}
            onClick={() =>
              onChange(ids.includes(p.id) ? ids.filter((id) => id !== p.id) : [...ids, p.id])
            }
          >
            {p.name || "Unnamed person"}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function PartsSection() {
  const { event, setEvent, ops, newId } = useEvent();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const main = ops.parts.find((p) => p.id === MAIN_PART_ID);
  const parts = [
    {
      id: MAIN_PART_ID,
      name: main?.name ?? "Main programme",
      component: undefined as EventComponent | undefined,
    },
    ...(event.components ?? []).map((component) => ({
      id: componentPartId(component.id),
      name: component.name,
      component,
    })),
  ];
  const validIds = new Set(parts.map((p) => p.id));
  const belongs = (item: { partId?: string }, id: string) =>
    (item.partId && validIds.has(item.partId) ? item.partId : MAIN_PART_ID) === id;
  const assign = (id: string) => (id === MAIN_PART_ID ? undefined : id);
  const patchSession = (id: string, patch: Partial<Session>) =>
    setEvent({
      ...event,
      sessions: event.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  const patchBreak = (id: string, patch: Partial<Break>) =>
    setEvent({ ...event, breaks: event.breaks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  const counts = pendingDelete ? partItemCounts(event, pendingDelete) : { sessions: 0, breaks: 0 };
  const partDropdown = (id: string, onChange: (id: string) => void) => (
    <Field label="Part">
      <select
        aria-label="Part"
        className={input}
        value={id}
        onChange={(e) => onChange(e.target.value)}
      >
        {parts.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </Field>
  );

  return (
    <section className="min-w-0 border-t border-border pt-8" aria-label="Parts of this event">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">STEP 02</p>
          <h2 className="mt-1 text-lg font-semibold text-navy">Parts of this event</h2>
        </div>
        <details className="relative">
          <summary className="flex min-h-11 cursor-pointer items-center rounded-md border border-border bg-background px-3 text-sm font-medium">
            + Add part
          </summary>
          <div className="absolute right-0 z-20 mt-2 max-h-80 w-72 max-w-[calc(100vw-3rem)] overflow-y-auto rounded-md border border-border bg-background p-2 shadow-lg">
            {COMPONENT_KINDS.map((kind) => (
              <Button
                key={kind}
                type="button"
                variant="ghost"
                className="min-h-11 w-full justify-start"
                onClick={(e) => {
                  setEvent(addPart(event, kind, newId()));
                  const d = e.currentTarget.closest("details");
                  if (d) d.open = false;
                }}
              >
                {componentBlueprint(kind).label}
              </Button>
            ))}
          </div>
        </details>
      </div>
      <div className="space-y-6">
        {parts.map(({ id, name, component: c }, index) => {
          const sessions = event.sessions.filter((s) => belongs(s, id));
          const breaks = event.breaks.filter((b) => belongs(b, id));
          const speakers = event.speakers.filter((p) =>
            sessions.some((s) => s.speakerIds.includes(p.id)),
          );
          const patch = (value: Partial<EventComponent>) => {
            if (c) setEvent(editPart(event, c.id, value));
          };
          const checklists = c?.operationalRequirements ?? main?.checklists;
          const changeChecklist = (key: "av" | "staffing" | "protocol", values: string[]) => {
            if (c)
              patch({ operationalRequirements: { ...c.operationalRequirements, [key]: values } });
            else
              setEvent({
                ...event,
                ops: {
                  ...ops,
                  parts: ops.parts.map((p) =>
                    p.id === MAIN_PART_ID
                      ? { ...p, checklists: { ...p.checklists, [key]: values } }
                      : p,
                  ),
                },
              });
          };
          return (
            <article
              key={id}
              data-part-id={id}
              className="min-w-0 rounded-lg border border-border bg-surface p-4"
              onDragOver={(e) => {
                if (c) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (c && dragging !== null) setEvent(reorderPart(event, dragging, index - 1));
                setDragging(null);
              }}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="min-w-0 break-words text-base font-semibold text-foreground">
                  {name || "Unnamed part"}
                </h3>
                {c && (
                  <div className="flex flex-wrap gap-1">
                    <span
                      draggable
                      className="flex min-h-11 w-11 cursor-grab items-center justify-center text-muted-foreground"
                      title="Drag to reorder"
                      aria-label="Drag to reorder"
                      onDragStart={() => setDragging(index - 1)}
                      onDragEnd={() => setDragging(null)}
                    >
                      ⠿
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 w-11 p-0"
                      aria-label="Move part up"
                      title="Move part up"
                      disabled={index === 1}
                      onClick={() => setEvent(reorderPart(event, index - 1, index - 2))}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 w-11 p-0"
                      aria-label="Move part down"
                      title="Move part down"
                      disabled={index === parts.length - 1}
                      onClick={() => setEvent(reorderPart(event, index - 1, index))}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 w-11 p-0"
                      aria-label="Duplicate part"
                      title="Duplicate part"
                      onClick={() => {
                        const copy = structuredClone(c);
                        setEvent({
                          ...event,
                          components: [
                            ...(event.components ?? []).slice(0, index),
                            { ...copy, id: newId(), name: `${c.name} (copy)` },
                            ...(event.components ?? []).slice(index),
                          ],
                        });
                      }}
                    >
                      <Copy />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 w-11 p-0"
                      aria-label="Delete part"
                      title="Delete part"
                      onClick={() => {
                        const n = partItemCounts(event, c.id);
                        if (n.sessions + n.breaks) setPendingDelete(c.id);
                        else setEvent(deletePart(event, c.id));
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid min-w-0 gap-3 md:grid-cols-3">
                <Field label="Part name">
                  <input
                    aria-label="Part name"
                    className={input}
                    value={name}
                    onChange={(e) =>
                      c
                        ? patch({ name: e.target.value })
                        : setEvent(renameMainPart(event, e.target.value))
                    }
                  />
                </Field>
                {c && (
                  <>
                    <Field label="Kind">
                      <select
                        aria-label="Kind"
                        className={input}
                        value={c.kind}
                        onChange={(e) => patch({ kind: e.target.value as ComponentKind })}
                      >
                        {COMPONENT_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {componentBlueprint(k).label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Day">
                      <input
                        aria-label="Part day"
                        className={input}
                        type="number"
                        min={1}
                        value={c.day ?? 1}
                        onChange={(e) => patch({ day: Math.max(1, Number(e.target.value)) })}
                      />
                    </Field>
                    <Field label="Start">
                      <input
                        aria-label="Part start"
                        className={input}
                        type="time"
                        value={c.startTime}
                        onChange={(e) => patch({ startTime: e.target.value })}
                      />
                    </Field>
                    <Field label="End (optional)">
                      <input
                        aria-label="Part end"
                        className={input}
                        type="time"
                        value={c.endTime ?? ""}
                        onChange={(e) =>
                          patch({
                            endTime: e.target.value || undefined,
                            ...(e.target.value
                              ? {
                                  durationMin: Math.max(
                                    0,
                                    toMin(e.target.value) - toMin(c.startTime),
                                  ),
                                }
                              : {}),
                          })
                        }
                      />
                    </Field>
                    <Field label="Duration (minutes)">
                      <input
                        className={input}
                        type="number"
                        min={0}
                        value={c.durationMin}
                        onChange={(e) =>
                          patch({
                            durationMin: Number(e.target.value),
                            ...(c.endTime
                              ? { endTime: fromMin(toMin(c.startTime) + Number(e.target.value)) }
                              : {}),
                          })
                        }
                      />
                    </Field>
                    <Field label="Track">
                      <input
                        aria-label="Part track"
                        className={input}
                        value={c.track ?? ""}
                        onChange={(e) => patch({ track: e.target.value || undefined })}
                      />
                    </Field>
                    <Field label="Venue">
                      <input
                        aria-label="Part venue"
                        className={input}
                        value={c.venue ?? ""}
                        onChange={(e) => patch({ venue: e.target.value || undefined })}
                      />
                    </Field>
                    <Field label="Hosts (comma-separated)">
                      <input
                        aria-label="Part hosts"
                        className={input}
                        value={(c.hosts ?? []).join(",")}
                        onChange={(e) => patch({ hosts: e.target.value.split(",") })}
                      />
                    </Field>
                    <Field label="Expected attendees">
                      <input
                        className={input}
                        type="number"
                        min={0}
                        value={c.expectedAttendees ?? ""}
                        onChange={(e) =>
                          patch({
                            expectedAttendees: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </Field>
                    <Field label="Notes">
                      <textarea
                        aria-label="Part notes"
                        className={input}
                        value={c.notes ?? ""}
                        onChange={(e) => patch({ notes: e.target.value })}
                      />
                    </Field>
                    <Field label="AI context">
                      <textarea
                        className={input}
                        value={c.aiContext ?? ""}
                        onChange={(e) => patch({ aiContext: e.target.value })}
                      />
                    </Field>
                  </>
                )}
              </div>
              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm">Sessions</h4>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() =>
                      setEvent({
                        ...event,
                        sessions: [
                          ...event.sessions,
                          {
                            id: newId(),
                            ...(assign(id) ? { partId: id } : {}),
                            title: "New session",
                            day: c?.day ?? main?.day ?? 1,
                            startTime: c?.startTime || "12:00",
                            durationMin: 30,
                            description: "",
                            speakerIds: [],
                            moderatorIds: [],
                          },
                        ],
                      })
                    }
                  >
                    + Add session
                  </Button>
                </div>
                {!sessions.length && (
                  <p className="text-sm text-muted-foreground">
                    No sessions in this part yet. Add a session or move one here from another part.
                  </p>
                )}
                <div className="space-y-4">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      data-session-id={s.id}
                      className="min-w-0 border-t border-border pt-4"
                    >
                      <div className="grid min-w-0 gap-3 md:grid-cols-3">
                        <Field label="Session title">
                          <input
                            aria-label="Session title"
                            className={input}
                            value={s.title}
                            onChange={(e) => patchSession(s.id, { title: e.target.value })}
                          />
                        </Field>
                        <Field label="Start time">
                          <input
                            aria-label="Session start"
                            className={input}
                            type="time"
                            value={s.startTime}
                            onChange={(e) => patchSession(s.id, { startTime: e.target.value })}
                          />
                        </Field>
                        <Field label="Duration (minutes)">
                          <input
                            className={input}
                            type="number"
                            min={0}
                            value={s.durationMin}
                            onChange={(e) =>
                              patchSession(s.id, { durationMin: Number(e.target.value) })
                            }
                          />
                        </Field>
                        <Field label="Day">
                          <input
                            className={input}
                            type="number"
                            min={1}
                            value={s.day ?? 1}
                            onChange={(e) =>
                              patchSession(s.id, { day: Math.max(1, Number(e.target.value)) })
                            }
                          />
                        </Field>
                        {partDropdown(id, (value) => patchSession(s.id, { partId: assign(value) }))}
                        <Field label="Description">
                          <textarea
                            className={input}
                            value={s.description}
                            onChange={(e) => patchSession(s.id, { description: e.target.value })}
                          />
                        </Field>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <PeoplePicker
                          label="Speakers"
                          people={event.speakers}
                          ids={s.speakerIds}
                          onChange={(speakerIds) => patchSession(s.id, { speakerIds })}
                        />
                        <PeoplePicker
                          label="Moderators"
                          people={event.moderators}
                          ids={s.moderatorIds}
                          onChange={(moderatorIds) => patchSession(s.id, { moderatorIds })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-2 min-h-11"
                        onClick={() =>
                          setEvent({
                            ...event,
                            sessions: event.sessions.filter((x) => x.id !== s.id),
                          })
                        }
                      >
                        Remove session
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm">Breaks</h4>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() =>
                      setEvent({
                        ...event,
                        breaks: [
                          ...event.breaks,
                          {
                            id: newId(),
                            ...(assign(id) ? { partId: id } : {}),
                            label: "Break",
                            day: c?.day ?? main?.day ?? 1,
                            startTime: c?.startTime || "12:00",
                            durationMin: 20,
                          },
                        ],
                      })
                    }
                  >
                    + Add break
                  </Button>
                </div>
                {!breaks.length && (
                  <p className="text-sm text-muted-foreground">
                    No breaks in this part yet. Add a break or move one here from another part.
                  </p>
                )}
                <div className="space-y-4">
                  {breaks.map((b) => (
                    <div key={b.id} data-break-id={b.id} className="border-t border-border pt-4">
                      <div className="grid min-w-0 gap-3 md:grid-cols-3">
                        <Field label="Break name">
                          <input
                            aria-label="Break name"
                            className={input}
                            value={b.label}
                            onChange={(e) => patchBreak(b.id, { label: e.target.value })}
                          />
                        </Field>
                        <Field label="Start time">
                          <input
                            className={input}
                            type="time"
                            value={b.startTime}
                            onChange={(e) => patchBreak(b.id, { startTime: e.target.value })}
                          />
                        </Field>
                        <Field label="Duration (minutes)">
                          <input
                            className={input}
                            type="number"
                            min={0}
                            value={b.durationMin}
                            onChange={(e) =>
                              patchBreak(b.id, { durationMin: Number(e.target.value) })
                            }
                          />
                        </Field>
                        <Field label="Day">
                          <input
                            className={input}
                            type="number"
                            min={1}
                            value={b.day ?? 1}
                            onChange={(e) =>
                              patchBreak(b.id, { day: Math.max(1, Number(e.target.value)) })
                            }
                          />
                        </Field>
                        {partDropdown(id, (value) => patchBreak(b.id, { partId: assign(value) }))}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11"
                        onClick={() =>
                          setEvent({ ...event, breaks: event.breaks.filter((x) => x.id !== b.id) })
                        }
                      >
                        Remove break
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-semibold">Speakers in this part</h4>
                {speakers.length ? (
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {speakers.map((p) => (
                      <li key={p.id}>
                        {p.name}
                        {p.role ? ` · ${p.role}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No speakers assigned yet. Choose speakers in a session above.
                  </p>
                )}
              </div>
              <details className="mt-6">
                <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">
                  Checklists · AV, staffing and protocol
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {(["av", "staffing", "protocol"] as const).map((k) => (
                    <Checklist
                      key={k}
                      label={k === "av" ? "AV" : k === "staffing" ? "Staffing" : "Protocol"}
                      values={checklists?.[k] ?? []}
                      onChange={(values) => changeChecklist(k, values)}
                    />
                  ))}
                </div>
              </details>
            </article>
          );
        })}
      </div>
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this part?</AlertDialogTitle>
            <AlertDialogDescription>
              This part has {counts.sessions} sessions and {counts.breaks} breaks. Move them to Main
              programme, or delete them too?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button
              type="button"
              className="min-h-11 h-auto whitespace-normal"
              onClick={() => {
                if (pendingDelete) setEvent(deletePart(event, pendingDelete, "move"));
                setPendingDelete(null);
              }}
            >
              Move to Main programme
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11"
              onClick={() => {
                if (pendingDelete) setEvent(deletePart(event, pendingDelete, "delete"));
                setPendingDelete(null);
              }}
            >
              Delete them
            </Button>
            <AlertDialogCancel className="min-h-11">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
