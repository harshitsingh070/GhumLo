import { Play } from "lucide-react";
import SafeImage from "./SafeImage.jsx";
import { photoFor } from "../lib/destinations.js";

/** DestinationVlogs — Section 24
 *  Compact horizontal guide rows: thumbnail + play badge + duration. */
export default function DestinationVlogs({ videos, destination }) {
  if (!Array.isArray(videos) || videos.length === 0) return null;

  return (
    <section
      id="vlogs"
      aria-label="Destination vlogs"
      className="glass-panel h-full scroll-mt-24 rounded-[16px] p-5 text-white"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <Play className="h-3.5 w-3.5 fill-current text-[#FF4D4D]" aria-hidden="true" />
        <h2 className="font-display text-[15px] font-bold tracking-tight text-white">
          Watch {destination || "Destination"} Guides
        </h2>
      </div>
      <p className="mt-0.5 pl-5 text-[11px] text-slate-400">
        Top curated travel videos and guides from YouTube.
      </p>

      <ul className="mt-3 space-y-3.5">
        {videos.slice(0, 3).map((v, i) => {
          const fallbackImg = photoFor(destination, i);
          return (
          <li key={i}>
            <a
              href={v.link}
              target="_blank"
              rel="noopener noreferrer"
              title={v.title}
              className="tcc-focus group flex items-center gap-3 rounded-xl"
            >
              {/* Thumbnail with Play + duration */}
              <span className="relative block h-[62px] w-[112px] shrink-0 overflow-hidden rounded-[10px] bg-slate-900">
                <SafeImage
                  src={v.thumbnail || fallbackImg}
                  alt=""
                  className="h-full w-full object-cover"
                  fallback={
                    <span className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">
                      <Play className="h-5 w-5" />
                    </span>
                  }
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF0000]/95 text-white shadow-md transition-transform group-hover:scale-105">
                    <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                  </span>
                </span>
                {v.duration && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-px text-[9px] font-semibold text-white">
                    {v.duration}
                  </span>
                )}
              </span>

              {/* Video Info */}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold leading-snug text-white group-hover:text-[var(--coral)]">
                  {v.title}
                </span>
                {(v.channel || v.duration) && (
                  <span className="mt-1 block truncate text-[11px] text-slate-400">
                    {[v.channel, v.duration].filter(Boolean).join(" • ")} ›
                  </span>
                )}
              </span>
            </a>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
