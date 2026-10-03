import { useEffect, useState } from "react";

/** Tiny hash router — no dependencies, works on both the Vite dev server
 *  (5173) and the FastAPI static hosting (8000), including refresh.
 *
 *  Routes use "#/…" hashes: "#/" home, "#/destinations", "#/how".
 *  Plain "#anchor" hashes are in-page scroll targets and are ignored by
 *  the router, so existing "#plan" / "#itinerary" links keep working.
 */

const PATHS = {
  home: "/",
  destinations: "/destinations",
  how: "/how",
};

export function parseRoute() {
  const h = typeof window !== "undefined" ? window.location.hash || "" : "";
  if (h === "#/destinations" || h.startsWith("#/destinations")) return "destinations";
  if (h === "#/how" || h.startsWith("#/how")) return "how";
  return "home";
}

export function navigate(path) {
  window.location.hash = `#${PATHS[path] ?? PATHS.home}`;
}

/** Go to a page, then optionally scroll to an element on it.
 *  Same-page calls just scroll. */
export function go(path, scrollId) {
  const target = PATHS[path] ?? PATHS.home;
  const doScroll = () => {
    if (scrollId) {
      document.getElementById(scrollId)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0 });
    }
  };
  if (parseRoute() !== path) {
    navigate(path);
    // Wait a tick for the new page to render before scrolling.
    setTimeout(doScroll, 120);
  } else {
    doScroll();
  }
  void target;
}

/** Current route: "home" | "destinations" | "how". Smooth-scrolls to top on
 *  route changes; ignores plain in-page anchors. */
export function useHashRoute() {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => {
    const onChange = () => {
      const h = window.location.hash || "";
      // Plain "#anchor" links are in-page scrolling, not routes.
      if (h !== "" && !h.startsWith("#/")) return;
      setRoute(parseRoute());
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
