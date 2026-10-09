/** Shared external-URL sanitizer for provider/API-supplied links.
 *  Only http(s) URLs are allowed — everything else (javascript:, data:,
 *  vbscript:, file:, blob:, empty, non-strings) is rejected as null so
 *  callers can omit the link or render non-clickable text instead.
 *  Never transforms an arbitrary URL into a trusted one. */
const SAFE_SCHEME = /^https?:\/\//i;

export function sanitizeExternalUrl(url) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!SAFE_SCHEME.test(trimmed)) return null;
  return trimmed;
}
