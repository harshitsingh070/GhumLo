import goa from "../assets/destinations/goa.jpg";
import goaPalolem from "../assets/destinations/goa-palolem.jpg";
import goaBogmalo from "../assets/destinations/goa-bogmalo.jpg";
import goaCand1 from "../assets/destinations/goa-cand1.jpg";
import goaCand2 from "../assets/destinations/goa-cand2.jpg";
import goaFort from "../assets/destinations/sample-goa-fort.jpg";
import heroGoa from "../assets/destinations/hero-goa.jpg";
import jaipur from "../assets/destinations/jaipur.jpg";
import manali from "../assets/destinations/manali.jpg";
import mumbai from "../assets/destinations/mumbai.jpg";
import delhi from "../assets/destinations/delhi.jpg";
import london from "../assets/destinations/london.jpg";

/** Shared destination catalogue: used by the home section cards and the
 *  full Destinations page. Card clicks prefill the planner (onPick). */
export const DESTINATIONS = [
  {
    name: "Goa",
    tag: "Beach escapes",
    price: "From ₹8,999",
    img: goa,
    alt: "Goa beach with palm trees",
    blurb: "Sun, sand and Portuguese lanes — India's easiest getaway.",
    season: "Best Oct – Mar",
  },
  {
    name: "Jaipur",
    tag: "Culture & heritage",
    price: "From ₹6,499",
    img: jaipur,
    alt: "Hawa Mahal in Jaipur",
    blurb: "Pink palaces, bazaars and hill forts in a single weekend.",
    season: "Best Oct – Mar",
  },
  {
    name: "Manali",
    tag: "Mountains & adventure",
    price: "From ₹9,200",
    img: manali,
    alt: "Snowy Manali mountains",
    blurb: "Snow peaks, pine valleys and adventure sports.",
    season: "Best Apr – Jun",
  },
  {
    name: "Mumbai",
    tag: "City & food",
    price: "From ₹7,500",
    img: mumbai,
    alt: "Mumbai skyline at dusk",
    blurb: "Sea faces, street food and non-stop city energy.",
    season: "Best Nov – Feb",
  },
  {
    name: "Delhi",
    tag: "Culture & history",
    price: "From ₹5,999",
    img: delhi,
    alt: "Historic monument in Delhi",
    blurb: "Mughal monuments, old markets and big-city food.",
    season: "Best Oct – Mar",
  },
  {
    name: "London",
    tag: "International escape",
    price: "From ₹42,000",
    img: london,
    alt: "London riverside skyline",
    blurb: "The classic international trip — planned within budget.",
    season: "Best May – Sep",
  },
];

/** Extra Goan shots so cards don't repeat one photo. */
const GOA_POOL = [goa, goaPalolem, goaBogmalo, goaCand1, goaCand2, goaFort, heroGoa];

/** Every bundled photo — used for hash-picked variety on destinations
 *  without their own shoot (so Paris never shows the Goa fallback). */
const ALL_PHOTOS = [goa, goaPalolem, goaBogmalo, goaCand1, goaCand2, goaFort, heroGoa, jaipur, manali, mumbai, delhi, london];

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Bundled photo for a destination: exact catalogue match, else a stable
 *  hash-pick so every location gets its own consistent (if generic) shot. */
export function bundledHeroFor(destination) {
  const name = String(destination || "").toLowerCase();
  const match = DESTINATIONS.find((d) => name.includes(d.name.toLowerCase()));
  if (match) return match.img;
  return ALL_PHOTOS[hashString(name || "trip") % ALL_PHOTOS.length];
}

/** Dynamic hero image for a destination + live plan.
 *  Priority: live hotel photo from this search (real place you may stay) →
 *  bundled catalogue match → hash-picked bundled photo.
 *  Returns { src, fallback } — wire fallback into img onError. */
export function heroImageFor(destination, plan) {
  const fallback = bundledHeroFor(destination);
  const live = plan?.best_pick?.hotel?.image;
  if (typeof live === "string" && /^https?:\/\//i.test(live.trim())) {
    return { src: live.trim(), fallback };
  }
  return { src: fallback, fallback: null };
}

/** Every bundled photo for a destination. Catalogue cities keep their own
 *  shot; anywhere else gets a stable hash-rotated slice of all photos so
 *  different searches look different instead of all falling back to Goa. */
export function photoPoolFor(destination) {
  const name = String(destination || "").toLowerCase();
  const match = DESTINATIONS.find((d) => name.includes(d.name.toLowerCase()));
  if (!match) {
    const start = hashString(name || "trip") % ALL_PHOTOS.length;
    return [...ALL_PHOTOS.slice(start), ...ALL_PHOTOS.slice(0, start)];
  }
  return match.name === "Goa" ? GOA_POOL : [match.img];
}

/** Photo for a destination, optionally offset by position in a list. */
export function photoFor(destination, index = 0) {
  const pool = photoPoolFor(destination);
  return pool[index % pool.length];
}
