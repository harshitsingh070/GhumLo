import { go } from "../lib/router.js";

const LINKS = [
  { label: "Plan a trip", action: () => go("trip") },
  { label: "Destinations", href: "#/destinations" },
  { label: "How it works", href: "#/how" },
  { label: "About", action: () => go("home", "about") },
];

/** Clean white/light footer. */
export default function Footer() {
  return (
    <footer
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid #E5E7EB",
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
              <span className="font-display t-card-lg" style={{ color: "#102A43" }}>
                GhoomLo
              </span>
            </a>
            <p className="mt-3 max-w-xs t-body" style={{ color: "#52606D" }}>
              Plan smarter. Explore more. Spend less.
            </p>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 t-nav" aria-label="Footer">
            {LINKS.map((l) =>
              l.href ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="tcc-focus transition-colors"
                  style={{ color: "#52606D" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#FF6B57"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#52606D"; }}
                >
                  {l.label}
                </a>
              ) : (
                <button
                  key={l.label}
                  type="button"
                  onClick={l.action}
                  className="tcc-focus transition-colors"
                  style={{ color: "#52606D" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#FF6B57"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#52606D"; }}
                >
                  {l.label}
                </button>
              )
            )}
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 pt-6 t-meta sm:flex-row" style={{ borderTop: "1px solid #EEF2F6", color: "#829AB1" }}>
          <p>© 2026 GhoomLo. All rights reserved.</p>
          <p>Plan smarter. Explore more. Spend less.</p>
        </div>
      </div>
    </footer>
  );
}
