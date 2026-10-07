/** Unified loaders — one spinner language everywhere.
 *  Variants: Spinner (bare ring), Loader (centered ring + label),
 *  ButtonSpinner (white ring for coral buttons), CardSkeleton
 *  (placeholder blocks), InlineThinking (chat-style status row). */

const RING = "animate-spin rounded-full border-2";

export function Spinner({ size = 16, tone = "coral", className = "" }) {
  const px = typeof size === "number" ? `${size}px` : size;
  const color =
    tone === "white"
      ? "border-white/30 border-t-white"
      : "border-[#E5E7EB] border-t-[#FF6B57]";
  return (
    <span
      className={`${RING} ${color} ${className}`}
      style={{ width: px, height: px }}
      aria-hidden="true"
    />
  );
}

export function ButtonSpinner() {
  return <Spinner size={16} tone="white" />;
}

export default function Loader({ label = "Loading…", size = 20 }) {
  return (
    <p className="flex items-center justify-center gap-2.5 py-8 t-body text-[#52606D]" role="status">
      <Spinner size={size} />
      {label}
    </p>
  );
}

export function InlineThinking({ label = "Working on it…" }) {
  return (
    <p className="flex items-center gap-2 t-small text-[#52606D]" role="status">
      <Spinner size={16} />
      {label}
    </p>
  );
}

export function CardSkeleton({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="tcc-skeleton h-4 rounded-lg bg-[#EEF2F6]"
          style={{ width: `${[92, 78, 86, 64][i % 4]}%` }}
        />
      ))}
    </div>
  );
}
