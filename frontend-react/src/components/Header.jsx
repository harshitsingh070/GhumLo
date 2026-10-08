import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { navigate, useHashRoute } from "../lib/router.js";

const NAV = [
  { label: "Explore", route: "home", exact: true },
  { label: "Plan Trip", route: "trip" },
  { label: "Destinations", route: "destinations" },
  { label: "How it works", route: "how" },
];

/** GhoomLo — light primary navbar.
 *  White bar with subtle border/shadow. Logo · nav · search · bell ·
 *  avatar · coral CTA. Collapses to a drawer below 1024px. */
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
      className="no-print fixed inset-x-0 top-0 z-[2000] pt-3 sm:pt-4"
      style={{ pointerEvents: "none" }}
    >
      <div className="tcc-container">
        <div
          className="flex h-[62px] items-center gap-4 rounded-[18px] px-4 sm:px-5"
          style={{
            pointerEvents: "auto",
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
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
              className="font-display hidden t-card-lg min-[360px]:inline"
              style={{ color: "#102A43", fontWeight: 700 }}
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
                  className="tcc-focus relative rounded-[10px] px-3.5 py-2 t-nav transition-colors xl:px-4"
                  style={{
                    color: active ? "#FF6B57" : "#3E5463",
                    background: active ? "#FFF1EE" : "transparent",
                    fontWeight: active ? 700 : 600,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = "#102A43";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = "#52606D";
                  }}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full"
                      style={{ background: "#FF6B57" }}
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
              className="hidden items-center gap-2 rounded-full px-3.5 py-2 transition-colors lg:flex"
              style={{
                background: "#F1F5F9",
                border: "1px solid #E5E7EB",
              }}
              role="search"
            >
              <Search className="h-4 w-4 shrink-0" style={{ color: "#5B6B7B" }} aria-hidden="true" />
              <label htmlFor="nav-search" className="sr-only">
                Search destinations, hotels, experiences
              </label>
              <input
                id="nav-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search destinations..."
                className="w-44 bg-transparent t-input outline-none xl:w-60"
                style={{ color: "#102A43" }}
              />
            </form>

            {/* CTA */}
            <button
              type="button"
              onClick={goTrip}
              className="btn-primary hidden h-[38px] px-5 t-btn sm:inline-flex"
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
                border: "1px solid #E5E7EB",
                color: "#52606D",
                background: "#F1F5F9",
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
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              boxShadow: "0 12px 28px -12px rgb(23 32 51 / 0.14)",
            }}
            aria-label="Mobile navigation"
          >
            <form onSubmit={submitSearch} className="mb-2 flex items-center gap-2 rounded-full px-3.5 py-2.5"
              style={{ background: "#F1F5F9", border: "1px solid #E5E7EB" }}
              role="search">
              <Search className="h-4 w-4 shrink-0" style={{ color: "#5B6B7B" }} aria-hidden="true" />
              <label htmlFor="nav-search-m" className="sr-only">Search destinations</label>
              <input
                id="nav-search-m"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search destinations, hotels..."
                className="w-full bg-transparent t-input outline-none"
                style={{ color: "#102A43" }}
              />
            </form>

            {NAV.map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNav(item)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left t-nav"
                  style={{
                    color: active ? "#FF6B57" : "#3E5463",
                    background: active ? "#FFF1EE" : "transparent",
                    fontWeight: active ? 700 : 600,
                  }}
                >
                  {item.label}
                  {active && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#FF6B57" }} />}
                </button>
              );
            })}

            <button
              type="button"
              onClick={goTrip}
              className="btn-primary mt-2 h-[46px] w-full t-btn"
            >
              Plan a trip <span aria-hidden="true">→</span>
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
