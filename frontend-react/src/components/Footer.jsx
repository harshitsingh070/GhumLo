import { go } from "../lib/router.js";

const LINKS = [
  { label: "Plan a trip", action: () => go("trip") },
  { label: "Destinations", href: "#/destinations" },
  { label: "How it works", href: "#/how" },
  { label: "About", action: () => go("home", "about") },
];

/** Clean white/light footer with hackathon attribution. */
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
            <a href="#/" className="flex items-center" aria-label="GhoomLo — home">
              <img
                src="/logo-full.png"
                alt="GhoomLo logo"
                className="h-12 w-auto object-contain"
                loading="lazy"
              />
            </a>
            <p className="mt-3 max-w-xs t-body" style={{ color: "#52606D" }}>
              Plan smarter. Explore more. Spend less.
            </p>
            {/* Hackathon identity */}
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 t-meta"
              style={{ background: "#FFF1EE", border: "1px solid #FFD9D1", color: "#FF6B57" }}
            >
              ✦ SerpApi India Hackathon 2026 — Travel &amp; Local Discovery
            </span>
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

        <div className="mt-10 flex flex-col items-center justify-between gap-3 pt-6 t-meta sm:flex-row" style={{ borderTop: "1px solid #EEF2F6", color: "#5B6B7B" }}>
          <p>© 2026 GhoomLo. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Live data powered by{" "}
            <a
              href="https://serpapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold transition-colors"
              style={{ color: "#FF6B57" }}
            >
              SerpApi
            </a>
            {" "}· AI by{" "}
            <a
              href="https://groq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold transition-colors"
              style={{ color: "#FF6B57" }}
            >
              Groq
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
