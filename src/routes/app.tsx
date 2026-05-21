import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-shell/sidebar";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Dashboard · FlowStage" },
      { name: "description", content: "FlowStage operations dashboard for conference and event teams." },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="-mt-14 flex min-h-screen bg-surface pt-14 lg:mt-0 lg:pt-0">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
