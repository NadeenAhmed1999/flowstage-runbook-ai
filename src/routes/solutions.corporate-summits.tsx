import { createFileRoute } from "@tanstack/react-router";
import { SolutionTemplate } from "@/components/landing/solution-template";

export const Route = createFileRoute("/solutions/corporate-summits")({
  head: () => ({
    meta: [
      { title: "Corporate Summits — FlowStage" },
      { name: "description", content: "Deliver multi-day corporate summits with integrated ceremonies, press conferences, and gala programming coordinated by AI." },
      { property: "og:title", content: "FlowStage for Corporate Summits" },
      { property: "og:description", content: "AI event operations for multi-component corporate programmes." },
    ],
  }),
  component: () => (
    <SolutionTemplate
      eyebrow="Solutions · Corporate"
      title="One platform for the entire multi-day corporate summit."
      subtitle="Opening ceremony, keynote day, press conference, sponsor exhibition, gala dinner — coordinated as one event, not five."
      pains={[
        { title: "Parallel activities go uncoordinated", body: "Exhibition floor, press room, and main stage often run on separate documents that never reconcile." },
        { title: "Executive briefings lag behind changes", body: "Every schedule tweak triggers a manual re-brief of speakers, moderators, and sponsors." },
        { title: "Readiness is a gut feel", body: "Nobody knows whether the summit is genuinely ready until show day." },
      ]}
      outcomes={[
        { title: "Modular event builder", body: "Add ceremonies, receptions, press, exhibitions, and site visits as first-class components that share one timeline." },
        { title: "Instant stakeholder briefings", body: "Speaker, moderator, sponsor, and production briefings generated from your current plan, ready to copy or export." },
        { title: "Readiness Score & Smart Review", body: "0–100 readiness across 10 categories with top risks and specific recommended actions." },
      ]}
    />
  ),
});
