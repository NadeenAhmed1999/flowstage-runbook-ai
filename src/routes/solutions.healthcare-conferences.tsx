import { createFileRoute } from "@tanstack/react-router";
import { SolutionTemplate } from "@/components/landing/solution-template";

export const Route = createFileRoute("/solutions/healthcare-conferences")({
  head: () => ({
    meta: [
      { title: "Healthcare Conferences — FlowStage" },
      { name: "description", content: "Run compliant, high-stakes healthcare conferences with AI-generated run sheets, sponsor separation, and captioning coordination." },
      { property: "og:title", content: "FlowStage for Healthcare Conferences" },
      { property: "og:description", content: "AI event operations for regulated healthcare programming." },
    ],
  }),
  component: () => (
    <SolutionTemplate
      eyebrow="Solutions · Healthcare"
      title="Event operations built for regulated healthcare programming."
      subtitle="Manage summits, clinical congresses, and cross-border regulatory forums with AI that understands compliance separation, captioning, and KOL logistics."
      pains={[
        { title: "Sponsor separation from clinical content", body: "Compliance mandates keep sponsor moments distinct from clinical talks — hard to enforce across a 12-hour show clock." },
        { title: "Captioning and accessibility gaps", body: "Live captioning for keynotes and panels is often an afterthought that surfaces during rehearsal, not planning." },
        { title: "VIP and KOL arrivals", body: "Senior clinicians and health-authority representatives need discreet arrival paths and dedicated escorts." },
      ]}
      outcomes={[
        { title: "Compliance-aware run sheets", body: "Sponsor cues placed on separate timeline rows with explicit acknowledgement scripts and lower-third windows." },
        { title: "Captioning built into the plan", body: "AV blueprint injects captioning feeds for keynote and panel by default; Readiness Score flags missing coverage." },
        { title: "Protocol layered into every component", body: "Opening ceremonies, press conferences, and gala dinners inherit protocol notes for order of precedence and photo calls." },
      ]}
    />
  ),
});
