// @vitest-environment happy-dom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { EventData } from "@/components/event-context";
import { resolveOps } from "@/lib/event-migrate";
import { pickEventMeta } from "@/lib/event-persist";

const mocked = vi.hoisted(() => ({
  userId: "cedar-owner" as string | null,
  load: vi.fn(), save: vi.fn(), reset: vi.fn(), navigate: vi.fn(), refresh: vi.fn(), refetch: vi.fn(),
  duplicate: vi.fn(), delete: vi.fn(), query: { data: [] as unknown[], isPending: false, isError: false },
}));
vi.mock("@tanstack/react-router", async importOriginal => ({
  ...await importOriginal<typeof import("@tanstack/react-router")>(),
  createFileRoute: () => (options: unknown) => ({ options }),
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => mocked.navigate,
}));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ ...mocked.query, refetch: mocked.refetch }), useQueryClient: () => ({ invalidateQueries: mocked.refresh }) }));
vi.mock("@/components/app-shell/topbar", () => ({ AppTopbar: () => null }));
vi.mock("@/components/app-shell/account-menu", () => ({ useAuthState: () => ({ userId: mocked.userId, ready: true }) }));
vi.mock("@/hooks/use-saved-event", () => ({ useSavedEvent: () => ({ savedId: null, status: "idle", error: null, save: mocked.save, load: mocked.load, reset: mocked.reset }) }));
vi.mock("@/lib/event-store", () => ({ listSavedEvents: vi.fn(), duplicateSavedEvent: mocked.duplicate, deleteSavedEvent: mocked.delete }));
// All persistence is mocked: these tests cannot reach the real backend.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/components/event-context", async importOriginal => {
  const original = await importOriginal<typeof import("@/components/event-context")>();
  return { ...original, useEvent: () => ({ event: invented }) };
});
import { Route } from "@/routes/app.events";

const invented: EventData = { name: "Cedar Forum", type: "Conference", date: "2026-11-21", sessions: [], speakers: [], moderators: [], breaks: [], sponsors: [], components: [], avRequirements: "" };
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  mocked.userId = "cedar-owner";
  mocked.query = { data: [{ id: "cedar-event", title: "Cedar Forum", ownerId: "cedar-owner", updatedAt: "2026-11-21T21:00:00Z", eventMeta: pickEventMeta(invented), ops: resolveOps(invented) }], isPending: false, isError: false };
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
async function render() {
  const Page = Route.options.component;
  if (!Page) throw new Error("Missing Events page");
  if ("preload" in Page && typeof Page.preload === "function") await Page.preload();
  await act(async () => root.render(<Page />));
}
function button(name: string): HTMLButtonElement {
  const found = [...document.querySelectorAll("button")].find(item => item.textContent === name);
  if (!found) throw new Error(`Missing action ${name}`);
  return found;
}

it("hides Delete for collaborators while keeping Open and Duplicate", async () => {
  mocked.userId = "cedar-collaborator";
  await render();
  expect([...container.querySelectorAll("button")].some(item => item.textContent === "Delete")).toBe(false);
  expect(button("Open").disabled).toBe(false);
  expect(button("Duplicate").disabled).toBe(false);
});
it("requires owner confirmation and names the target before deleting", async () => {
  await render();
  await act(async () => button("Delete").click());
  expect(mocked.delete).not.toHaveBeenCalled();
  expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain("Cedar Forum");
  await act(async () => button("Delete event").click());
  expect(mocked.delete).toHaveBeenCalledWith("cedar-event");
  expect(mocked.refresh).toHaveBeenCalled();
});
it("loads Open before navigating to Overview without any write", async () => {
  await render();
  await act(async () => button("Open").click());
  expect(mocked.load).toHaveBeenCalledWith("cedar-event");
  expect(mocked.navigate).toHaveBeenCalledWith({ to: "/app" });
  expect(mocked.load.mock.invocationCallOrder[0]).toBeLessThan(mocked.navigate.mock.invocationCallOrder[0] ?? 0);
  expect(mocked.save).not.toHaveBeenCalled();
  expect(mocked.duplicate).not.toHaveBeenCalled();
  expect(mocked.delete).not.toHaveBeenCalled();
});
it("refreshes the list after duplicating without switching the current event", async () => {
  await render();
  await act(async () => button("Duplicate").click());
  expect(mocked.duplicate).toHaveBeenCalledWith("cedar-event");
  expect(mocked.refresh).toHaveBeenCalled();
  expect(mocked.load).not.toHaveBeenCalled();
});
it("provides setup/import navigation for an empty list", async () => {
  mocked.query.data = [];
  await render();
  expect(container.querySelector('a[href="/app/new"]')).not.toBeNull();
  expect(container.querySelector('a[href="/app/import"]')).not.toBeNull();
});
it("retries a failed list read rather than offering empty-list actions", async () => {
  mocked.query = { data: [], isPending: false, isError: true };
  await render();
  await act(async () => button("Retry").click());
  expect(mocked.refetch).toHaveBeenCalledOnce();
  expect(container.querySelector('a[href="/app/new"]')).toBeNull();
});
