import type { ReactNode } from "react";

/** Header for full-width pages outside the app shell: eyebrow, title, one-line subtitle, actions (one primary). */
export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
