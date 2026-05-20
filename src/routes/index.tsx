import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/hero";
import { SamplePreview } from "@/components/landing/sample-preview";
import { FeatureGrid } from "@/components/landing/feature-grid";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlowStage — AI Run-of-Show Generator for Events" },
      {
        name: "description",
        content:
          "Generate professional, timecoded run-of-show documents in seconds. Built for stage managers, broadcast producers, and event leads.",
      },
      { property: "og:title", content: "FlowStage — AI Run-of-Show Generator" },
      {
        property: "og:description",
        content: "Operational clarity for high-stakes stage production.",
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
