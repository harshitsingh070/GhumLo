/** Short About blurb: what the app does + hackathon credit. */
import { DESTINATIONS } from "../lib/destinations.js";

export default function About() {
  const img = DESTINATIONS?.[0]?.img;
  return (
    <section
      id="about"
      aria-label="About"
      className="scroll-mt-24 rounded-[20px] bg-white p-7 text-[#102A43] sm:p-9"
      style={{
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <p
            className="t-badge uppercase text-[#FF6B57]"
          >
            About GhoomLo
          </p>
          <h2 className="font-display mt-2 t-section text-[#102A43]">
            Built Around Your Budget
          </h2>
          <p className="mt-3 max-w-3xl t-body text-[#52606D]">
            GhoomLo searches live flights, hotels, and nearby places, then matches the cheapest
            workable combination to the budget you set — with a day-by-day itinerary clustered
            around your stay. Powered by SerpApi live search &amp; Groq AI.
          </p>
        </div>
        {img && (
          <img
            src={img}
            alt="Destination"
            loading="lazy"
            className="h-32 w-full rounded-2xl object-cover md:w-56"
            style={{ border: "1px solid #E5E7EB" }}
          />
        )}
      </div>
    </section>
  );
}
