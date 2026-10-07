import { useEffect, useState } from "react";

/** Image with graceful degradation for SerpApi photo URLs.
 *
 *  Google-hosted thumbnails (lh3.googleusercontent.com) often 403 when the
 *  browser sends a Referer header, so we send none (referrerPolicy) — that
 *  alone fixes most loads. When a URL is still dead/expired, onError swaps
 *  to `fallback` instead of showing a broken-image icon. Resets whenever
 *  `src` changes (new plan, new filter).
 */
export default function SafeImage({ src, alt = "", className = "", fallback = null, fallbackSrc = null }) {
  const [failed, setFailed] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setFailed(false);
    setCurrentSrc(src);
  }, [src]);

  const handleError = () => {
    // Live photo dead/expired? Try the bundled fallback photo once before
    // giving up to the placeholder panel.
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    setFailed(true);
  };

  if (!currentSrc || failed)
    return (
      fallback ?? (
        <span
          className={`flex items-center justify-center bg-[#F1F5F9] text-[#829AB1] ${className}`}
          aria-label={alt || "Image unavailable"}
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.5-3.5a1.5 1.5 0 0 0-2 0L6 21" />
          </svg>
        </span>
      )
    );
  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={handleError}
    />
  );
}
