import { useState } from "react";
import { cleanHosts } from "@/lib/parts-edit";

export function HostsInput({ hosts, onChange, className }: {
  hosts: string[];
  onChange: (hosts: string[]) => void;
  className: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return <input
    aria-label="Part hosts"
    className={className}
    value={draft ?? hosts.join(", ")}
    onChange={e => setDraft(e.target.value)}
    onBlur={e => {
      onChange(cleanHosts(e.target.value));
      setDraft(null);
    }}
  />;
}