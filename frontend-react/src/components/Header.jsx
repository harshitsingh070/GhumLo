import { useState } from "react";
import { Compass, Menu, X } from "lucide-react";
import { go } from "../lib/router.js";

/** Premium sticky navbar: logo left, links center, and CTA right.
 *  68px tall, warm-cream surface, collapses to a hamburger menu on mobile.
 *  Destinations is a full page; Plan Trip scrolls to the planner on home.
 */
export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const linkCls =
    "tcc-focus rounded-lg px-3.5 py-2 text-left text-[15px] font-medium text-ink/80 transition-colors hover:bg-sand hover:text-ink dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur-sm dark:border-white/10 dark:bg-ink/95">
      <div className="tcc-container">
        <div className="flex h-[68px] items-center gap-6">
          {/* ── Left: logo ── */}
          <a href="#/" className="flex shrink-0 items-center gap-2.5" aria-label="Trip Cost Compass — home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white dark:bg-white dark:text-ink">
              <Compass className="h-5 w-5" />
            </span>
            <span className="font-display hidden text-[17px] font-extrabold tracking-tight text-ink min-[400px]:inline dark:text-white">
              Trip Cost Compass
            </span>
          </a>

          {/* ── Center: links (desktop) ── */}
          <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
            <a href="#/" className={linkCls}>
              Explore
            </a>
            <button type="button" onClick={() => go("home", "plan")} className={linkCls}>
              Plan Trip
            </button>
            <a href="#/destinations" className={linkCls}>
              Destinations
            </a>
          </nav>

          {/* ── Right: CTA + theme + hamburger ── */}
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <button
              type="button"
              onClick={() => go("home", "plan")}
              className="tcc-focus hidden items-center gap-1.5 rounded-[11px] bg-clay px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-clay-dark hover:shadow sm:inline-flex"
            >
              Plan a trip →
            </button>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className="tcc-focus flex h-10 w-10 items-center justify-center rounded-[11px] border border-line text-ink transition-colors hover:bg-sand lg:hidden dark:border-white/15 dark:text-white dark:hover:bg-white/10"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {open && (
        <nav
          className="animate-fade-rise border-t border-line bg-cream px-4 pb-5 pt-3 lg:hidden dark:border-white/10 dark:bg-ink"
          aria-label="Mobile"
        >
          <div className="tcc-container flex flex-col gap-1 !px-0">
            <a
              href="#/"
              onClick={close}
              className="tcc-focus rounded-xl px-3 py-3 text-base font-medium text-ink transition-colors hover:bg-sand dark:text-white dark:hover:bg-white/10"
            >
              Explore
            </a>
            <button
              type="button"
              onClick={() => {
                close();
                go("home", "plan");
              }}
              className="tcc-focus rounded-xl px-3 py-3 text-left text-base font-medium text-ink transition-colors hover:bg-sand dark:text-white dark:hover:bg-white/10"
            >
              Plan Trip
            </button>
            <a
              href="#/destinations"
              onClick={close}
              className="tcc-focus rounded-xl px-3 py-3 text-base font-medium text-ink transition-colors hover:bg-sand dark:text-white dark:hover:bg-white/10"
            >
              Destinations
            </a>
            <button
              type="button"
              onClick={() => {
                close();
                go("home", "plan");
              }}
              className="tcc-focus mt-2 inline-flex items-center justify-center gap-1.5 rounded-[11px] bg-clay px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-clay-dark"
            >
              Plan a trip →
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
