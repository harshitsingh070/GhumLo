import { CalendarDays, ExternalLink } from "lucide-react";

/** "Local events" list (google_events via backend) — placed near the
 *  itinerary. Honest framing: events Google listed with dates inside the
 *  trip window, a sample rather than a complete calendar. Renders null
 *  when empty (no events found / fetch failed — never an error state).
 *  Props: events [{title, date, venue, description, link}], destination. */
export default function EventsSection({ events, destination }) {
  if (!Array.isArray(events) || events.length === 0) return null;

  return (
    <section
      aria-label="Local events"
      className="rounded-[18px] border border-line bg-white p-6 shadow-card sm:p-7 dark:border-white/10 dark:bg-ink"
    >
      <h2 className="font-display text-xl font-extrabold tracking-tight text-ink dark:text-white">
        Local events in {destination}
      </h2>
      <p className="mb-4 mt-1 text-sm text-smoke dark:text-white/55">
        As listed by Google Events with dates inside your trip window — a sample, not a complete
        calendar.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {events.map((e, i) => (
          <li
            key={`${e.link || e.title}-${i}`}
            className="flex gap-3 rounded-xl border border-line bg-cream p-4 dark:border-white/10 dark:bg-white/5"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-clay/10 text-clay">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              {e.link ? (
                <a
                  href={e.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tcc-focus font-semibold text-ink underline-offset-2 hover:text-clay hover:underline dark:text-white"
                >
                  {e.title}
                  <ExternalLink className="ml-1 inline h-3.5 w-3.5 text-smoke" />
                </a>
              ) : (
                <p className="font-semibold text-ink dark:text-white">{e.title}</p>
              )}
              {(e.date || e.venue) && (
                <p className="mt-0.5 text-xs font-medium text-clay">
                  {e.date}
                  {e.venue ? ` · ${e.venue}` : ""}
                </p>
              )}
              {e.description && (
                <p className="mt-1 line-clamp-2 text-sm text-smoke dark:text-white/60">
                  {e.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
