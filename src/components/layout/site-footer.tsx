export function SiteFooter() {
  return (
    <footer className="no-print border-t border-border bg-surface py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <span className="font-mono text-xs font-bold uppercase tracking-tighter text-navy">
          FlowStage Ops
        </span>
        <div className="flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <a href="#" className="hover:text-accent transition-colors">Terms</a>
          <a href="#" className="hover:text-accent transition-colors">Security</a>
          <a href="#" className="hover:text-accent transition-colors">API</a>
          <a href="#" className="hover:text-accent transition-colors">Support</a>
        </div>
        <p className="text-[11px] text-muted-foreground">© 2025 FlowStage Systems. All markers set.</p>
      </div>
    </footer>
  );
}
