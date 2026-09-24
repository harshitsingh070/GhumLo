/** Short About blurb: what the app does + hackathon credit. */
export default function About() {
  return (
    <section id="about" aria-label="About" className="scroll-mt-24 rounded-[18px] bg-sand p-7 sm:p-9 dark:bg-white/5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">About</p>
      <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-[28px] dark:text-white">
        Built around your budget
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink/75 dark:text-white/70">
        Trip Cost Compass searches live flights, hotels, and nearby places, then matches
        the cheapest workable combination to the budget you set — with a day-by-day
        itinerary clustered around your stay. Built for the SerpApi India Hackathon
        2026, Travel &amp; Local Discovery track.
      </p>
    </section>
  );
}
