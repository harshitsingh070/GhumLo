import { useEffect, useState } from "react";
import { Bell, Menu, Search, X } from "lucide-react";
import { navigate, useHashRoute } from "../lib/router.js";

const NAV = [
  { label: "Explore", route: "home", exact: true },
  { label: "Plan Trip", route: "trip" },
  { label: "Destinations", route: "destinations" },
  { label: "How it works", route: "how" },
];

/** GhoomLo — the single primary navbar.
 *  Floats over the hero as a rounded frosted-glass bar (fixed, never a
 *  second bar). Logo · nav · search · bell · avatar · coral CTA.
 *  Collapses to a drawer below 1024px. */
export default function Header() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const route = useHashRoute();

  useEffect(() => {
    setOpen(false);
  }, [route]);

  const isActive = (item) => {
    if (item.route) return route === item.route;
    if (item.exact) return route === "home";
    return false;
  };

  const goTrip = () => {
    setOpen(false);
    navigate("trip");
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    window.location.hash = q ? `#/destinations?q=${encodeURIComponent(q)}` : "#/destinations";
    setOpen(false);
  };

  const handleNav = (item) => {
    setOpen(false);
    window.location.hash = item.route && item.route !== "home" ? `#/${item.route}` : "#/";
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-[2000] px-3 pt-3 sm:px-5 sm:pt-4"
      style={{ pointerEvents: "none" }}
    >
      <div className="tcc-container !px-0">
        <div
          className="flex h-[62px] items-center gap-4 rounded-[18px] px-4 sm:px-5"
          style={{
            pointerEvents: "auto",
            background: "rgba(4, 24, 32, 0.72)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 18px 45px rgba(0,0,0,0.32)",
          }}
        >
          {/* ── Logo ── */}
          <a
            href="#/"
            onClick={() => setOpen(false)}
            className="flex shrink-0 items-center gap-2.5 rounded-lg"
            aria-label="GhoomLo home"
          >
            <img
              src="/logo.png"
              alt=""
              aria-hidden="true"
              className="h-8 w-8 rounded-full object-cover"
              loading="eager"
            />
            <span
              className="font-display hidden text-[17px] font-extrabold tracking-tight min-[360px]:inline"
              style={{ color: "var(--text-primary)" }}
            >
              GhoomLo
            </span>
          </a>

          {/* ── Center nav (desktop) ── */}
          <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNav(item)}
                  aria-current={active ? "page" : undefined}
                  className="tcc-focus relative rounded-[10px] px-3.5 py-2 text-[14px] font-medium transition-colors xl:px-4"
                  style={{ color: active ? "var(--coral)" : "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full"
                      style={{ background: "var(--coral)" }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── Right: search + bell + avatar + CTA ── */}
          <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-2.5">
            {/* Search pill (desktop) */}
            <form
              onSubmit={submitSearch}
              className="hidden items-center gap-2 rounded-full px-3.5 py-2 transition-colors focus-within:border-[rgba(255,114,94,0.6)] lg:flex"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              role="search"
            >
              <Search className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
              <label htmlFor="nav-search" className="sr-only">
                Search destinations, hotels, experiences
              </label>
              <input
                id="nav-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search destinations..."
                className="w-44 bg-transparent text-[13px] outline-none placeholder:text-[var(--text-muted)] xl:w-60"
                style={{ color: "var(--text-primary)" }}
              />
            </form>

            {/* Bell */}
            <button
              type="button"
              aria-label="Notifications"
              className="hidden h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 lg:flex"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.11)",
                color: "var(--text-secondary)",
              }}
            >
              <Bell className="h-4 w-4" />
            </button>

            {/* Avatar */}
            <div
              className="hidden h-8 w-8 items-center justify-center overflow-hidden rounded-full lg:flex"
              style={{ background: "var(--coral)", color: "#fff", fontSize: 13, fontWeight: 700 }}
              aria-hidden="true"
            >
              G
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={goTrip}
              className="btn-primary hidden h-[38px] px-5 text-[13px] sm:inline-flex"
            >
              Plan a trip <span aria-hidden="true">→</span>
            </button>

            {/* Hamburger (mobile) */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className="tcc-focus flex h-10 w-10 items-center justify-center rounded-[11px] transition-colors lg:hidden"
              style={{
                border: "1px solid rgba(255,255,255,0.14)",
                color: "var(--text-secondary)",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        {open && (
          <nav
            className="animate-fade-rise mt-2 overflow-hidden rounded-[18px] px-3 pb-4 pt-2 lg:hidden"
            style={{
              pointerEvents: "auto",
              background: "rgba(4, 24, 32, 0.96)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.4)",
            }}
            aria-label="Mobile navigation"
          >
            <form onSubmit={submitSearch} className="mb-2 flex items-center gap-2 rounded-full px-3.5 py-2.5"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
              role="search">
              <Search className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
              <label htmlFor="nav-search-m" className="sr-only">Search destinations</label>
              <input
                id="nav-search-m"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search destinations, hotels..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                style={{ color: "var(--text-primary)" }}
              />
            </form>

            {NAV.map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNav(item)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-base font-medium"
                  style={{
                    color: active ? "var(--coral)" : "var(--text-secondary)",
                    background: active ? "rgba(255,114,94,0.08)" : "transparent",
                  }}
                >
                  {item.label}
                  {active && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--coral)" }} />}
                </button>
              );
            })}

            <button
              type="button"
              onClick={goTrip}
              className="btn-primary mt-2 h-[46px] w-full text-base"
            >
              Plan a trip <span aria-hidden="true">→</span>
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
