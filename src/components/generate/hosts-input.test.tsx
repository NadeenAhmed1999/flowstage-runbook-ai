// @vitest-environment happy-dom
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { HostsInput } from "./hosts-input";

it("preserves every comma keystroke until blur, then commits two cleaned hosts", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  let committed: string[] = [];
  function Harness() {
    const [hosts, setHosts] = useState<string[]>([]);
    return <HostsInput className="" hosts={hosts} onChange={value => {
      committed = value;
      setHosts(value);
    }} />;
  }
  await act(async () => root.render(<Harness />));
  const input = container.querySelector("input");
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (!input || !setter) throw new Error("Input unavailable");
  await act(async () => input.focus());
  let raw = "";
  for (const character of ["Host A", ",", " Host B"].join("")) {
    raw += character;
    await act(async () => {
      setter.call(input, raw);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(input.value).toBe(raw);
    expect(committed).toEqual([]);
  }
  await act(async () => input.blur());
  expect(committed).toEqual(["Host A", "Host B"]);
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});