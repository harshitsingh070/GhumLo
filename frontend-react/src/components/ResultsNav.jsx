const LINKS = [
  ["results", "Overview"],
  ["budget", "Cost"],
  ["assistant", "AI guide"],
  ["itinerary", "Itinerary"],
  ["know", "Good to know"],
  ["vlogs", "Vlogs"],
];

export default function ResultsNav() {
  return (
    <nav
      aria-label="Trip result sections"
      className="sticky top-[76px] z-10 -mx-1 flex gap-1 overflow-x-auto rounded-xl border border-line bg-cream/90 p-1 backdrop-blur-sm dark:border-white/10 dark:bg-ink/90"
    >
      {LINKS.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          className="tcc-focus shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold text-smoke transition-colors hover:bg-white hover:text-ink dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white sm:px-4 sm:text-sm"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
