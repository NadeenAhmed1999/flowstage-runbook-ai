import { Link } from "@tanstack/react-router";

export function SiteNav() {
  return (
    <nav className="no-print sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-mono text-sm font-bold uppercase tracking-tighter text-foreground">
            FlowStage //
          </Link>
          <div className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground transition-colors">Platform</Link>
            <Link to="/app" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/run-of-show" className="hover:text-foreground transition-colors">Showcase</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/app" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link
            to="/app"
            className="rounded-md bg-navy px-3.5 py-1.5 text-sm font-medium text-navy-foreground shadow-sm hover:bg-navy/90 transition-colors"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
