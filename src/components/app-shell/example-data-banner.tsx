export function ExampleDataBanner({ currentEvent = false }: { currentEvent?: boolean }) {
  return (
    <div className="border-b border-border bg-surface px-6 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
      {currentEvent ? "Example data — built-in sample event" : "Example data — this page shows a fixed sample, not your saved events"}
    </div>
  );
}
