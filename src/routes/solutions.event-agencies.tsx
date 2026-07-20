import { createFileRoute } from "@tanstack/react-router";
import { SolutionTemplate } from "@/components/landing/solution-template";

export const Route = createFileRoute("/solutions/event-agencies")({
  head: () => ({
    meta: [
      { title: "Event Agencies — FlowStage" },
      { name: "description", content: "Deliver more events, faster, without losing operational quality. FlowStage is the AI OS for event production agencies." },
      { property: "og:title", content: "FlowStage for Event Agencies" },
      { property: "og:description", content: "Ship production-grade events at agency scale." },
    ],
  }),
  component: () => (
    <SolutionTemplate
      eyebrow="Solutions · Agencies"
      title="Ship production-grade events at agency scale."
      subtitle="Templates, briefings, and readiness scoring standardized across every client so your senior producers spend time on the moments that matter."
      pains={[
        { title: "Every new client starts from zero", body: "Producers rebuild the same run-sheet skeleton for every conference, summit, gala." },
        { title: "Junior producers lack pattern recognition", body: "Timing errors and coverage gaps only get caught in rehearsal — if at all." },
        { title: "Handovers between planners lose context", body: "Documents, chats, and email threads never fully hand over." },
      ]}
      outcomes={[
        { title: "Reusable event templates", body: "Healthcare, executive, awards, launches — pre-built blueprints with production-tested AV, protocol, and staffing." },
        { title: "Institutional expertise, on tap", body: "Smart Review and Readiness Score bring senior showcaller-level judgement to every plan." },
        { title: "A shared operating picture", body: "Copilot answers questions across the whole plan — no more chasing threads." },
      ]}
    />
  ),
});
