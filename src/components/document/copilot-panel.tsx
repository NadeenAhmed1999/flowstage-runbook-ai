import { friendlyAiError, type FriendlyAiError } from "@/lib/ai-errors";
import { AiErrorNotice } from "@/components/ai-error-notice";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Send, Sparkles, User as UserIcon, AlertCircle } from "lucide-react";
import { askCopilot, type CopilotAnswer } from "@/lib/copilot.functions";
import type { EventData } from "@/components/event-context";
import type { RunSheet } from "@/lib/generate-run-sheet.functions";
import type { ReadinessReport } from "@/lib/readiness-score.functions";
import type { SmartReview } from "@/lib/smart-review.functions";

type Message =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; content: string; answer: CopilotAnswer };

const SUGGESTED_PROMPTS = [
  "What operational risks do you see?",
  "Is my networking time sufficient?",
  "Which session has the highest risk?",
  "Generate a moderator briefing for the panel.",
  "What's missing before this event is production-ready?",
  "Which speakers require additional coordination?",
];

export function CopilotPanel({
  event,
  runSheet,
  readiness,
  smartReview,
}: {
  event: EventData;
  runSheet: RunSheet | null;
  readiness: ReadinessReport | null;
  smartReview: SmartReview | null;
}) {
  const askFn = useServerFn(askCopilot);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FriendlyAiError | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const buildContext = () => ({
    eventName: event.name,
    eventType: event.type,
    eventDate: event.date,
    eventEndDate: event.endDate,
    avRequirements: event.avRequirements,
    sessions: event.sessions.map((s) => ({
      title: s.title,
      startTime: s.startTime,
      durationMin: s.durationMin,
      day: s.day,
      description: s.description,
      speakers: s.speakerIds
        .map((id) => event.speakers.find((p) => p.id === id))
        .filter(Boolean)
        .map((p) => `${p!.name} (${p!.role})`),
      moderators: s.moderatorIds
        .map((id) => event.moderators.find((p) => p.id === id))
        .filter(Boolean)
        .map((p) => `${p!.name} (${p!.role})`),
    })),
    breaks: event.breaks.map((b) => ({
      label: b.label,
      startTime: b.startTime,
      durationMin: b.durationMin,
      day: b.day,
    })),
    sponsors: event.sponsors.map((s) => ({ name: s.name, placement: s.placement })),
    components: (event.components ?? []).map((c) => ({
      label: c.kind,
      name: c.name,
      day: c.day,
      startTime: c.startTime,
      durationMin: c.durationMin,
      venue: c.venue,
      hosts: c.hosts,
      aiContext: c.aiContext,
    })),
    runSheet: runSheet ?? undefined,
    readiness: readiness ?? undefined,
    smartReview: smartReview ?? undefined,
  });

  const send = async (q: string) => {
    const question = q.trim();
    if (!question || loading) return;
    setError(null);
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: question };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const answer = await askFn({
        data: { question, context: buildContext(), history },
      });
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer.answer,
          answer,
        },
      ]);
    } catch (e) {
      setError(friendlyAiError(e, "Couldn't get an answer. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-navy/[0.03] to-accent/[0.04] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-navy text-navy-foreground">
            <Bot className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
              AI · Event Copilot
            </p>
            <h3 className="text-sm font-semibold text-navy">Ask anything about this event</h3>
          </div>
        </div>
        <div className="hidden items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:flex">
          <Capsule label="Run sheet" on={Boolean(runSheet)} />
          <Capsule label="Readiness" on={Boolean(readiness)} />
          <Capsule label="Smart review" on={Boolean(smartReview)} />
        </div>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="max-h-[480px] min-h-[260px] space-y-4 overflow-y-auto bg-surface/40 px-5 py-5">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-border bg-background px-4 py-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm leading-relaxed text-foreground">
                I have full context on <span className="font-medium text-navy">{event.name}</span> —
                its run sheet, readiness score, and smart-review findings. Ask me about risks,
                timing, talent coordination, or generate a briefing.
              </p>
            </div>
            <div>
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Suggested questions
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => void send(p)}
                    disabled={loading}
                    className="group flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2.5 text-left text-xs text-foreground transition-all hover:-translate-y-px hover:border-accent/40 hover:bg-surface hover:shadow-sm disabled:opacity-50"
                  >
                    <span className="text-accent">›</span>
                    <span className="leading-relaxed group-hover:text-navy">{p}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="flex max-w-[85%] items-start gap-2">
                <div className="rounded-lg rounded-tr-sm bg-navy px-3.5 py-2 text-sm text-navy-foreground shadow-sm">
                  {m.content}
                </div>
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy">
                  <UserIcon className="h-3 w-3" />
                </div>
              </div>
            </div>
          ) : (
            <AssistantMessage key={m.id} message={m} onFollowUp={(q) => void send(q)} loading={loading} />
          ),
        )}

        {loading && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Bot className="h-3 w-3" />
            </div>
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" />
            </div>
            <span className="text-xs text-muted-foreground">Copilot is thinking…</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <AiErrorNotice error={error} />
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-border bg-background px-4 py-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          placeholder="Ask the Copilot about risks, timing, talent, or generate a brief…"
          className="min-h-[40px] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-3.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 hover:shadow-md disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
    </section>
  );
}

function AssistantMessage({
  message,
  onFollowUp,
  loading,
}: {
  message: Extract<Message, { role: "assistant" }>;
  onFollowUp: (q: string) => void;
  loading: boolean;
}) {
  const { answer } = message;
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Bot className="h-3 w-3" />
      </div>
      <div className="max-w-[88%] space-y-2.5">
        <div className="rounded-lg rounded-tl-sm border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-sm">
          <Markdown text={answer.answer} />
        </div>
        {answer.citations && answer.citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {answer.citations.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        )}
        {answer.followUps && answer.followUps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {answer.followUps.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onFollowUp(q)}
                disabled={loading}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-foreground transition-colors hover:border-accent/40 hover:bg-surface hover:text-navy disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Capsule({ label, on }: { label: string; on: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
      />
      {label}
    </span>
  );
}

/** Minimal markdown: paragraphs, bullets, bold. No external dep. */
function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*[-*•]\s+/.test(l));
        if (isList) {
          return (
            <ul key={i} className="space-y-1 pl-4">
              {lines.map((l, j) => (
                <li key={j} className="list-disc text-sm">
                  <Inline text={l.replace(/^\s*[-*•]\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed">
            {lines.map((l, j) => (
              <span key={j}>
                <Inline text={l} />
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-navy">
              {p.slice(2, -2)}
            </strong>
          );
        }
        if (p.startsWith("`") && p.endsWith("`")) {
          return (
            <code key={i} className="rounded bg-surface px-1 py-0.5 font-mono text-[12px]">
              {p.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
