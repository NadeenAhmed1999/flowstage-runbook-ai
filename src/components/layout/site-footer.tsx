export function SiteFooter() {
  return (
    <footer className="no-print border-t border-border bg-surface py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <span className="font-mono text-xs font-bold uppercase tracking-tighter text-navy">
          FlowStage Ops
        </span>
        <p className="text-[11px] text-muted-foreground">© 2026 FlowStage</p>
      </div>
    </footer>
  );
}
