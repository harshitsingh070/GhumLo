import { Compass } from "lucide-react";
import { go } from "../lib/router.js";

const LINKS = [
  { label: "Plan a trip", action: () => go("home", "plan") },
  { label: "Destinations", href: "#/destinations" },
  { label: "How it works", action: () => go("home", "how") },
  { label: "About", action: () => go("home", "about") },
];

/** Professional footer: brand + description left, single clean nav, bottom bar. */
export default function Footer() {
  return (
    <footer className="bg-ink text-white/70">
      <div className="tcc-container py-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div>
            <a href="#/" className="flex items-center gap-2.5" aria-label="Trip Cost Compass — home">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-ink">
                <Compass className="h-5 w-5" />
              </span>
              <span className="font-display text-[17px] font-extrabold tracking-tight text-white">
                Trip Cost Compass
              </span>
            </a>
            <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-white/60">
              Plan smarter. Explore more. Spend less.
            </p>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-medium" aria-label="Footer">
            {LINKS.map((l) =>
              l.href ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="tcc-focus text-white/70 transition-colors hover:text-white"
                >
                  {l.label}
                </a>
              ) : (
                <button
                  key={l.label}
                  type="button"
                  onClick={l.action}
                  className="tcc-focus text-white/70 transition-colors hover:text-white"
                >
                  {l.label}
                </button>
              )
            )}
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-sm text-white/45 sm:flex-row">
          <p>© 2026 Trip Cost Compass</p>
          <p>Built for smarter travel planning.</p>
        </div>
      </div>
    </footer>
  );
}
