import { AlertTriangle, SearchX, WifiOff, RefreshCw } from "lucide-react";

const ICONS = { alert: AlertTriangle, search: SearchX, offline: WifiOff };

/** Unified full-card error state: icon, title, message, optional
 *  suggestion list, primary + secondary actions. Replaces every
 *  one-off error card so failures look and behave the same everywhere. */
export default function ErrorState({
  icon = "alert",
  title = "Something went wrong",
  message = "Please try again.",
  suggestions = [],
  actionLabel = "Try again",
  onAction,
  secondaryLabel,
  onSecondary,
}) {
  const Icon = ICONS[icon] || AlertTriangle;
  return (
    <section
      className="animate-fade-rise rounded-[24px] bg-white p-8 text-center"
      style={{
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
      }}
      role="alert"
      aria-label={title}
    >
      <span
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#FF6B57]"
        aria-hidden="true"
      >
        <Icon className="h-7 w-7" />
      </span>
      <h2 className="font-display mt-5 t-section text-[#102A43]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md t-body text-[#52606D]">{message}</p>
      {suggestions.length > 0 && (
        <ul className="mx-auto mt-4 max-w-md space-y-1.5 text-left t-body text-[#52606D]">
          {suggestions.map((s) => (
            <li key={s}>· {s}</li>
          ))}
        </ul>
      )}
      {(onAction || onSecondary) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onAction && (
            <button
              type="button"
              onClick={onAction}
              className="btn-primary inline-flex h-[46px] items-center gap-2 rounded-xl px-7 t-btn"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {actionLabel}
            </button>
          )}
          {onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="btn-secondary inline-flex h-[46px] items-center rounded-xl px-7 t-btn"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** Compact inline error for forms/chat rows: message + optional retry. */
export function InlineError({ message, onRetry, retryLabel = "Retry" }) {
  if (!message) return null;
  return (
    <p
      className="rounded-xl border border-[#FF6B57]/30 bg-[#FFF1EE] p-2.5 t-small text-[#F25542]"
      role="alert"
    >
      {message}{" "}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="tcc-focus font-bold underline underline-offset-2 hover:text-[#102A43]"
        >
          {retryLabel}
        </button>
      )}
    </p>
  );
}
