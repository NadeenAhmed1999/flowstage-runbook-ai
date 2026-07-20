import { createFileRoute } from "@tanstack/react-router";
import { SolutionTemplate } from "@/components/landing/solution-template";

export const Route = createFileRoute("/solutions/executive-forums")({
  head: () => ({
    meta: [
      { title: "Executive Forums — FlowStage" },
      { name: "description", content: "Invite-only executive forums with Chatham House discipline, VIP protocol, and discreet operations — coordinated by AI." },
      { property: "og:title", content: "FlowStage for Executive Forums" },
      { property: "og:description", content: "Discreet, high-trust event operations for C-suite gatherings." },
    ],
  }),
  component: () => (
    <SolutionTemplate
      eyebrow="Solutions · Executive"
      title="Discreet, high-trust operations for C-suite forums."
      subtitle="Chatham House rules, VIP arrival protocols, closed-door dinners — the operational discipline invite-only forums demand, without the manual overhead."
      pains={[
        { title: "Protocol lives in the head of the chair", body: "Order of precedence, seating, and press policy are tribal knowledge, not documented." },
        { title: "Closed-door discipline breaks under time pressure", body: "Recording, photography, and press policies slip when the schedule slips." },
        { title: "Executive stakeholders get too much detail", body: "Leadership needs a one-page brief, not a 40-page run sheet." },
      ]}
      outcomes={[
        { title: "Protocol codified per component", body: "VIP dinners, opening ceremonies, and press moments inherit the right protocol reminders automatically." },
        { title: "Executive summary briefings", body: "One-page briefs generated on demand for chair, board, and senior sponsors." },
        { title: "Ops discipline enforced by AI", body: "Smart Review flags any recording, media, or arrival slip before it hits the day." },
      ]}
    />
  ),
});
