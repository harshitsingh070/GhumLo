/** Short About blurb: what the app does + hackathon credit. */
export default function About() {
  return (
    <section
      id="about"
      aria-label="About"
      className="glass-card scroll-mt-24 p-7 sm:p-9 text-white"
      style={{
        background: "rgba(9, 38, 48, 0.80)",
        border: "1px solid rgba(255, 255, 255, 0.10)",
      }}
    >
      <p
        className="text-[11px] font-bold uppercase tracking-[0.16em]"
        style={{ color: "var(--coral)" }}
      >
        About GhoomLo
      </p>
      <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">
        Built Around Your Budget
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
        GhoomLo searches live flights, hotels, and nearby places, then matches the cheapest
        workable combination to the budget you set — with a day-by-day itinerary clustered
        around your stay. Powered by SerpApi live search &amp; Groq AI.
      </p>
    </section>
  );
}
