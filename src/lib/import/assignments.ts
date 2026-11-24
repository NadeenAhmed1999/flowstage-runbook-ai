/** Shared session-assignment helpers for setup and import review; values are ids or names, order is preserved. */
export type AssignOption = { value: string; label: string };
export const addAssignment = (assigned: string[], value: string) => value && !assigned.includes(value) ? [...assigned, value] : assigned;
export const removeAssignment = (assigned: string[], value: string) => assigned.filter(v => v !== value);
export function assignableOptions(options: AssignOption[], assigned: string[], query = "") {
  const q = query.trim().toLowerCase();
  return options.filter(o => o.value && o.label.trim() && !assigned.includes(o.value) && (!q || o.label.toLowerCase().includes(q)));
}
