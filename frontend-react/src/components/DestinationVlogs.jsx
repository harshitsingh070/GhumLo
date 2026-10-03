import { Play, ExternalLink } from "lucide-react";
import SafeImage from "./SafeImage.jsx";
import { photoFor } from "../lib/destinations.js";

/** DestinationVlogs — Section 24
 *  YouTube travel guides with play badge overlay, clean typography, and fallback. */
export default function DestinationVlogs({ videos, destination }) {
  if (!Array.isArray(videos) || videos.length === 0) return null;

  return (
    <section
      id="vlogs"
      aria-label="Destination vlogs"
      className="glass-panel scroll-mt-24 rounded-[24px] p-6 sm:p-7 text-white"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "rgba(255, 77, 77, 0.15)", color: "#FF4D4D" }}
        >
          <Play className="h-5 w-5 fill-current" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white">
            Watch {destination || "Destination"} Guides
          </h2>
          <p className="text-xs text-slate-300">
            Top curated travel videos and guides from YouTube.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {videos.slice(0, 3).map((v, i) => {
          const fallbackImg = photoFor(destination, i);
          return (
          <div
            key={i}
            className="group overflow-hidden rounded-[18px] transition-transform hover:-translate-y-1"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Thumbnail with Play Icon Overlay */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
              {fallbackImg ? (
                <a href={v.link} target="_blank" rel="noopener noreferrer" title={v.title} className="block h-full w-full">
                  <SafeImage
                    src={v.thumbnail || fallbackImg}
                    alt={v.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    fallback={
                      <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-400">
                        <Play className="h-8 w-8" />
                      </div>
                    }
                  />
                </a>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-400">
                  <Play className="h-8 w-8" />
                </div>
              )}
              {/* Play Badge */}
              <a
                href={v.link}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--coral)] text-white shadow-lg">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </span>
              </a>
            </div>

            {/* Video Info */}
            <div className="p-3.5">
              <a
                href={v.link}
                target="_blank"
                rel="noopener noreferrer"
                className="tcc-focus line-clamp-2 text-[13px] font-bold text-white hover:text-[var(--coral)]"
              >
                {v.title}
              </a>
              {(v.channel || v.duration) && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span>{[v.channel, v.duration].filter(Boolean).join(" · ")}</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </p>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}
