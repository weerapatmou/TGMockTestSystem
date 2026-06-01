export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex items-center gap-3 text-muted">
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent"
        />
        <span className="text-sm">กำลังโหลด…</span>
      </div>
    </div>
  );
}
