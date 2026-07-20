import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/hero";
import { SamplePreview } from "@/components/landing/sample-preview";
import { FeatureGrid } from "@/components/landing/feature-grid";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlowStage — AI Operating System for Professional Events" },
      {
        name: "description",
        content:
          "Plan, review, coordinate, and execute conferences, summits, forums, and corporate events with AI-powered operational intelligence.",
      },
      { property: "og:title", content: "FlowStage — AI OS for Professional Events" },
      {
        property: "og:description",
        content: "Run sheets, readiness scoring, briefings, and copilot in a single platform.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <SamplePreview />
      <FeatureGrid />
    </>
  );
}
