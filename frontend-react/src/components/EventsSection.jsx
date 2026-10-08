import { CalendarDays, ExternalLink } from "lucide-react";
import { buildMapUrl } from "../lib/format.js";

/** "Local events" list (google_events via backend) — placed near the
 *  itinerary. Honest framing: events Google listed with dates inside the
 *  trip window, a sample rather than a complete calendar. Renders null
 *  when empty (no events found / fetch failed — never an error state).
 *  Props: events [{title, date, venue, description, link}], destination. */
export default function EventsSection({ events, destination }) {
  if (!Array.isArray(events) || events.length === 0) return null;

  return (
    <section
      id="events"
      aria-label="Local events"
      className="scroll-mt-28 rounded-[24px] p-6 sm:p-7"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
        color: "#102A43",
      }}
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
          style={{ background: "#FFF1EE", color: "#FF6B57", border: "1px solid #FED7AA" }}
          aria-hidden="true"
        >
          <CalendarDays className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2
            className="font-display t-section"
            style={{ color: "#102A43" }}
          >
            Local events in {destination}
          </h2>
          <p className="mt-0.5 t-small" style={{ color: "#52606D" }}>
            As listed by Google Events with dates inside your trip window — a sample, not a
            complete calendar.
          </p>
        </div>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {events.map((e, i) => {
          // Venues carry no coords/address — link the venue name to a
          // "Venue, Destination" map search.
          const venueMapUrl = e.venue
            ? buildMapUrl(null, null, [e.venue, destination].filter(Boolean).join(", "))
            : null;
          return (
          <li
            key={`${e.link || e.title}-${i}`}
            className="flex gap-3 rounded-[16px] p-3.5 transition-all hover:-translate-y-0.5"
            style={{ background: "#F7F9FC", border: "1px solid #EEF2F6" }}
          >
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
              style={{ background: "#FFFBEB", color: "#F59E0B", border: "1px solid #FDE68A" }}
              aria-hidden="true"
            >
              <CalendarDays className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              {e.link ? (
                <a
                  href={e.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tcc-focus t-card underline-offset-2 hover:underline"
                  style={{ color: "#102A43" }}
                  onMouseEnter={(ev) => { ev.currentTarget.style.color = "#FF6B57"; }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.color = "#102A43"; }}
                >
                  {e.title}
                  <ExternalLink
                    className="ml-1 inline h-3.5 w-3.5"
                    style={{ color: "#5B6B7B" }}
                  />
                </a>
              ) : (
                <p className="t-card" style={{ color: "#102A43" }}>
                  {e.title}
                </p>
              )}
              {(e.date || e.venue) && (
                <p className="mt-0.5 t-meta" style={{ color: "#52606D" }}>
                  {e.date}
                  {e.venue && (
                    <>
                      {" · "}
                      {venueMapUrl ? (
                        <a
                          href={venueMapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${e.venue} — view on map`}
                          aria-label={`View venue ${e.venue} on map`}
                          className="tcc-focus underline-offset-2 hover:underline"
                          style={{ color: "#52606D" }}
                          onMouseEnter={(ev) => { ev.currentTarget.style.color = "#FF6B57"; }}
                          onMouseLeave={(ev) => { ev.currentTarget.style.color = "#52606D"; }}
                        >
                          {e.venue}
                        </a>
                      ) : (
                        e.venue
                      )}
                    </>
                  )}
                </p>
              )}
              {e.description && (
                <p className="mt-1 line-clamp-2 t-small" style={{ color: "#52606D" }}>
                  {e.description}
                </p>
              )}
            </div>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
