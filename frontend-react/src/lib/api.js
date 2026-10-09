/** Unified API client for all /api/* calls.
 *  Every request gets: JSON handling, an abort timeout, and consistent
 *  user-friendly errors — so no raw "Failed to fetch" ever reaches UI.
 *  Backend logic/routes are untouched; this only wraps fetch. */

export class ApiError extends Error {
  constructor(message, { status = 0, path = "", field = null, value = null, suggestions = [] } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
    // Structured location-error detail (400 unresolvable city): which form
    // field failed + "did you mean" airport candidates. Absent otherwise.
    this.field = field;
    this.value = value;
    this.suggestions = Array.isArray(suggestions) ? suggestions : [];
  }
}

/** True when the error is an unresolvable origin/destination with structured detail. */
export function isLocationError(err) {
  return err instanceof ApiError && err.status === 400 && (err.field === "origin" || err.field === "destination");
}

/** Map an HTTP status + server payload to a human-readable message. */
function messageForStatus(status, serverMessage, path) {
  if (serverMessage) return serverMessage;
  if (status === 400) return "That request didn't look right — please check your inputs and try again.";
  if (status === 404) return "We couldn't find what you asked for. Try different dates or a nearby airport.";
  if (status === 422) return "We couldn't understand that input. Try rephrasing it.";
  if (status === 429) return "Too many requests — please wait a minute and try again.";
  if (status === 502 || status === 503) return "Our travel data provider is having trouble. Please try again in a bit.";
  if (status >= 500) return "Something went wrong on our side. Please try again.";
  if (path === "/api/demo") return "Demo is unavailable right now.";
  return "Something went wrong. Please try again.";
}

/**
 * Single fetch wrapper used by the whole app.
 *  path — e.g. "/api/plan"
 *  options: { method, body (object, JSON-encoded), timeoutMs, signal }
 *  An external `signal` (e.g. a superseding search) aborts the request.
 *  Resolves parsed JSON; throws ApiError with a display-ready message.
 */
export async function apiRequest(path, { method = "GET", body, timeoutMs = 120000, signal } = {}) {
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onExternalAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      // Non-JSON response (proxy error page, etc.)
      data = null;
    }
    if (!res.ok) {
      throw new ApiError(messageForStatus(res.status, data?.error, path), {
        status: res.status,
        path,
        field: data?.field ?? null,
        value: data?.value ?? null,
        suggestions: data?.suggestions ?? [],
      });
    }
    return data ?? {};
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.name === "AbortError") {
      if (signal?.aborted) {
        // Superseded by a newer request (or unmounted) — caller ignores it.
        const aborted = new ApiError("Request superseded.", { status: 0, path });
        aborted.aborted = true;
        throw aborted;
      }
      throw new ApiError("That took too long — the servers are slow right now. Please try again.", {
        status: 0,
        path,
      });
    }
    // Network down / DNS / CORS / server unreachable.
    throw new ApiError("You're offline or the server can't be reached. Check your connection and try again.", {
      status: 0,
      path,
    });
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onExternalAbort);
  }
}

/** Turn any caught value into a display-ready string. */
export function friendlyError(err, fallback = "Something went wrong. Please try again.") {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) {
    if (/failed to fetch|networkerror|load failed/i.test(err.message)) {
      return "You're offline or the server can't be reached. Check your connection and try again.";
    }
    return err.message;
  }
  return fallback;
}
