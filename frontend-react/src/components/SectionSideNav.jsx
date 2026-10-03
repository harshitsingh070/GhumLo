import { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  Calendar,
  Film,
  Heart,
  Info,
  MapPin,
  SlidersHorizontal,
  TrendingDown,
  Wallet,
} from "lucide-react";

/** In-page section rail for the trip results: Overview · Itinerary · Budget
 *  · Insights · AI Guide · Experiences · Tools · Savings · Know · Vlogs.
 *
 *  This is NOT a second primary navbar — the single top navbar (Header) is
 *  untouched. It is a sticky rail (desktop ≥1440px only, where there is room
 *  beside the 1320px container) that jumps between result sections and
 *  highlights the section in view. Below 1440px it stays hidden (the header
 *  drawer covers navigation there) and in print (existing print CSS hides
 *  `nav[aria-label="Trip result sections"]`).
 *
 *  Reliability notes (the old version sometimes felt dead):
 *  - the visible-item list is re-derived from the live DOM on mount, on
 *    every plan change, AND on scroll/resize — never a one-time snapshot —
 *    so late-appearing sections (or searches that drop sections) can't leave
 *    stale or missing dots;
 *  - the active highlight is a deterministic scroll spy (nearest section top
 *    above 35% viewport) instead of observer thresholds that could stick;
 *  - clicks resolve the target live at click time.
 *
 *  Display: icon dots at 1440–1620px; icon + word labels at ≥1620px where
 *  there is room for the wider rail without covering content.
 */
const ITEMS = [
  { id: "results", label: "Overview", Icon: MapPin },
  { id: "itinerary", label: "Itinerary", Icon: Calendar },
  { id: "trip-budget-card", label: "Budget", Icon: Wallet },
  { id: "insights", label: "Insights", Icon: Activity },
  { id: "assistant", label: "AI Guide", Icon: Bot },
  { id: "places", label: "Experiences", Icon: Heart },
  { id: "trip-tools", label: "Tools", Icon: SlidersHorizontal },
  { id: "savings", label: "Savings", Icon: TrendingDown },
  { id: "know", label: "Good to Know", Icon: Info },
  { id: "vlogs", label: "Vlogs", Icon: Film },
];

const sameList = (a, b) =>
  a.length === b.length && a.every((item, i) => item.id === b[i].id);

export default function SectionSideNav({ plan }) {
  const [active, setActive] = useState(ITEMS[0].id);
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    let raf = 0;
    const refreshVisible = () => {
      setVisible((prev) => {
        const next = ITEMS.filter((item) => document.getElementById(item.id));
        return sameList(prev, next) ? prev : next;
      });
    };
    const spy = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const line = window.innerHeight * 0.35;
        let current = null;
        for (const item of ITEMS) {
          const el = document.getElementById(item.id);
          if (!el) continue;
          if (el.getBoundingClientRect().top <= line) current = item.id;
        }
        if (current) setActive((prev) => (prev === current ? prev : current));
        refreshVisible();
      });
    };
    refreshVisible();
    // Late mount safety net: one more scan after paint settles.
    const settled = setTimeout(refreshVisible, 350);
    window.addEventListener("scroll", spy, { passive: true });
    window.addEventListener("resize", spy);
    return () => {
      clearTimeout(settled);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", spy);
      window.removeEventListener("resize", spy);
    };
  }, [plan]);

  if (!plan || visible.length === 0) return null;

  const goTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setActive(id);
  };

  return (
    <nav
      aria-label="Trip result sections"
      className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 min-[1440px]:block"
    >
      <div
        className="flex flex-col gap-1 rounded-[20px] p-2"
        style={{
          background: "rgba(4, 24, 32, 0.78)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
        }}
      >
        {visible.map(({ id, label, Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => goTo(id)}
              aria-label={`Go to ${label}`}
              aria-current={isActive ? "true" : undefined}
              title={label}
              className="tcc-focus group relative flex h-10 w-10 items-center justify-center gap-2 rounded-full transition-all min-[1620px]:h-11 min-[1620px]:w-auto min-[1620px]:justify-start min-[1620px]:px-4"
              style={{
                background: isActive ? "var(--coral)" : "transparent",
                color: isActive ? "#fff" : "var(--text-muted)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.10)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {/* Word label — appears beside the symbol on very wide screens */}
              <span className="hidden whitespace-nowrap text-[13px] font-bold min-[1620px]:inline">
                {label}
              </span>
              {/* Floating label tooltip — icon-only mode; hidden once words show */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-bold opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 min-[1620px]:hidden"
                style={{
                  background: "rgba(4, 24, 32, 0.95)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "var(--text-primary)",
                }}
              >
                {label}
              </span>
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute -left-[9px] h-5 w-1 rounded-full"
                  style={{ background: "var(--coral)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
