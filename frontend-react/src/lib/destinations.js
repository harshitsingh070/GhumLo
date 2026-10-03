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

/** Every bundled photo for a destination. Other cities only have one shot. */
export function photoPoolFor(destination) {
  const name = String(destination || "").toLowerCase();
  const match = DESTINATIONS.find((d) => name.includes(d.name.toLowerCase()));
  if (!match) return DESTINATIONS.map((d) => d.img);
  return match.name === "Goa" ? GOA_POOL : [match.img];
}

/** Photo for a destination, optionally offset by position in a list. */
export function photoFor(destination, index = 0) {
  const pool = photoPoolFor(destination);
  return pool[index % pool.length];
}
