import { go } from "../lib/router.js";

const LINKS = [
  { label: "Plan a trip", action: () => go("trip") },
  { label: "Destinations", href: "#/destinations" },
  { label: "How it works", href: "#/how" },
  { label: "About", action: () => go("home", "about") },
];

/** Clean footer in dark glass style. */
export default function Footer() {
  return (
    <footer
      className="text-white/70"
      style={{
        background: "rgba(4, 20, 27, 0.95)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div className="tcc-container py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div>
            <a href="#/" className="flex items-center gap-2.5" aria-label="GhoomLo — home">
              <img
                src="/logo.png"
                alt="GhoomLo logo"
                className="h-9 w-9 rounded-full object-cover"
                loading="lazy"
              />
              <span className="font-display text-[17px] font-extrabold tracking-tight text-white">
                GhoomLo
              </span>
            </a>
            <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-slate-400">
              Plan smarter. Explore more. Spend less. Built with SerpApi live travel intelligence.
            </p>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-medium" aria-label="Footer">
            {LINKS.map((l) =>
              l.href ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="tcc-focus text-slate-400 transition-colors hover:text-white"
                >
                  {l.label}
                </a>
              ) : (
                <button
                  key={l.label}
                  type="button"
                  onClick={l.action}
                  className="tcc-focus text-slate-400 transition-colors hover:text-white"
                >
                  {l.label}
                </button>
              )
            )}
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© 2026 GhoomLo. All rights reserved.</p>
          <p>Designed for the SerpApi Travel Hackathon.</p>
        </div>
      </div>
    </footer>
  );
}
