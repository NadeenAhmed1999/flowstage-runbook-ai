import { describe, expect, it } from "vitest";
import { addAssignment, assignableOptions, removeAssignment } from "./assignments";

const people = [{ value: "p1", label: "Ama Mensah" }, { value: "p2", label: "Bo Lind" }, { value: "p3", label: "Cyra Ito" }];
describe("session assignments", () => {
  it("adds once, keeps order, removes only the chosen person", () => {
    expect(addAssignment(["p2"], "p1")).toEqual(["p2", "p1"]);
    expect(addAssignment(["p2"], "p2")).toEqual(["p2"]);
    expect(removeAssignment(["p2", "p1", "p3"], "p1")).toEqual(["p2", "p3"]);
  });
  it("excludes assigned people and filters by search", () => {
    expect(assignableOptions(people, ["p1"]).map(o => o.value)).toEqual(["p2", "p3"]);
    expect(assignableOptions(people, ["p1"], "ito").map(o => o.value)).toEqual(["p3"]);
  });
});

describe("picker search filter", () => {
  const opts = [{ value: "a", label: "Ama Kesse" }, { value: "b", label: "Bruno Tal" }, { value: "c", label: "Cara Amari" }];
  it("matches case-insensitively, excludes assigned, empty when no match", () => {
    expect(assignableOptions(opts, [], "AMA").map(o => o.value)).toEqual(["a", "c"]);
    expect(assignableOptions(opts, ["a"], "ama").map(o => o.value)).toEqual(["c"]);
    expect(assignableOptions(opts, [], "zzz")).toEqual([]);
  });
});
