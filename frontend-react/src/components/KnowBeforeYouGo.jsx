import { BookOpenCheck, ExternalLink } from "lucide-react";

/** Know-before-you-go: visa / entry / best-time / safety context from
 *  1x SerpApi google search. Renders null when the field is absent
 *  (fetch failure) so the core trip never depends on it. */
export default function KnowBeforeYouGo({ know, destination }) {
  if (!Array.isArray(know) || know.length === 0) return null;
  return (
    <section
      id="know"
      aria-label="Know before you go"
      className="scroll-mt-24 rounded-[18px] border border-line bg-white p-6 shadow-card sm:p-7 dark:border-white/10 dark:bg-ink"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine/10 text-pine dark:bg-white/10 dark:text-emerald-300">
          <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink dark:text-white">
            Know before you go{destination ? ` — ${destination}` : ""}
          </h2>
          <p className="text-xs text-smoke dark:text-white/55">
            Entry, season & safety pointers from live search · verify before booking
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-3">
        {know.slice(0, 5).map((k, i) => (
          <li key={i} className="rounded-xl bg-cream p-4 dark:bg-white/5">
            <a
              href={k.link}
              target="_blank"
              rel="noopener noreferrer"
              className="tcc-focus inline-flex items-start gap-1.5 font-semibold text-ink hover:text-clay hover:underline dark:text-white"
            >
              {k.title}
              <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
            {k.snippet && (
              <p className="mt-1 text-sm leading-relaxed text-smoke dark:text-white/65">{k.snippet}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
