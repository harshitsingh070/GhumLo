import goa from "../assets/destinations/goa.jpg";
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
