export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 border border-primary-300 border-t-ink rounded-full animate-spin" />
        <p className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500">
          Loading
        </p>
      </div>
    </div>
  );
}
