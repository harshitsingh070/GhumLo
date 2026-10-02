import { useEffect, useState } from "react";

/** Image with graceful degradation for SerpApi photo URLs.
 *
 *  Google-hosted thumbnails (lh3.googleusercontent.com) often 403 when the
 *  browser sends a Referer header, so we send none (referrerPolicy) — that
 *  alone fixes most loads. When a URL is still dead/expired, onError swaps
 *  to `fallback` instead of showing a broken-image icon. Resets whenever
 *  `src` changes (new plan, new filter).
 */
export default function SafeImage({ src, alt = "", className = "", fallback = null }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return fallback;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
