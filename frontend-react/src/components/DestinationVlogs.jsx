import { Clapperboard, ExternalLink } from "lucide-react";
import SafeImage from "./SafeImage.jsx";

/** Destination vlogs: top-3 YouTube results for the destination from
 *  1x SerpApi youtube search. Renders null when absent (fetch failure
 *  or no key) so the core trip never depends on it. */
export default function DestinationVlogs({ videos, destination }) {
  if (!Array.isArray(videos) || videos.length === 0) return null;
  return (
    <section
      id="vlogs"
      aria-label="Destination vlogs"
      className="scroll-mt-24 rounded-[18px] border border-line bg-white p-6 shadow-card sm:p-7 dark:border-white/10 dark:bg-ink"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay/10 text-clay">
          <Clapperboard className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink dark:text-white">
            Watch {destination || "the destination"} before you go
          </h2>
          <p className="text-xs text-smoke dark:text-white/55">
            Top travel vlogs from live YouTube search
          </p>
        </div>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {videos.slice(0, 3).map((v, i) => (
          <li key={i} className="overflow-hidden rounded-xl border border-line dark:border-white/10">
            {v.thumbnail ? (
              <a href={v.link} target="_blank" rel="noopener noreferrer" title={v.title}>
                <SafeImage
                  src={v.thumbnail}
                  className="h-32 w-full object-cover"
                  fallback={
                    <span className="flex h-32 items-center justify-center bg-sand dark:bg-white/5">
                      <Clapperboard className="h-8 w-8 text-smoke/50" aria-hidden="true" />
                    </span>
                  }
                />
              </a>
            ) : (
              <div className="flex h-32 items-center justify-center bg-sand dark:bg-white/5">
                <Clapperboard className="h-8 w-8 text-smoke/50" aria-hidden="true" />
              </div>
            )}
            <div className="p-3">
              <a
                href={v.link}
                target="_blank"
                rel="noopener noreferrer"
                className="tcc-focus line-clamp-2 text-sm font-semibold text-ink hover:text-clay hover:underline dark:text-white"
              >
                {v.title}
              </a>
              {(v.channel || v.duration) && (
                <p className="mt-1 flex items-center gap-1 text-xs text-smoke dark:text-white/55">
                  {[v.channel, v.duration].filter(Boolean).join(" · ")}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
