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
      className="h-full scroll-mt-24 rounded-[16px] bg-white p-5 text-[#102A43]"
      style={{
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <Play className="h-3.5 w-3.5 fill-current text-[#FF4D4D]" aria-hidden="true" />
        <h2 className="font-display t-activity text-[#102A43]">
          Watch {destination || "Destination"} Guides
        </h2>
      </div>
      <p className="mt-0.5 pl-5 t-meta-sm text-[#52606D]">
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
              <span className="relative block h-[62px] w-[112px] shrink-0 overflow-hidden rounded-[10px] bg-[#F1F5F9]">
                <SafeImage
                  src={v.thumbnail || fallbackImg}
                  alt=""
                  className="h-full w-full object-cover"
                  fallback={
                    <span className="flex h-full w-full items-center justify-center bg-[#F1F5F9] text-[#5B6B7B]">
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
                  <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-px t-badge-sm text-white">
                    {v.duration}
                  </span>
                )}
              </span>

              {/* Video Info */}
              <span className="min-w-0 flex-1">
                <span className="block truncate t-label text-[#102A43] group-hover:text-[#FF6B57]">
                  {v.title}
                </span>
                {(v.channel || v.duration) && (
                  <span className="mt-1 block truncate t-meta-sm text-[#5B6B7B]">
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
