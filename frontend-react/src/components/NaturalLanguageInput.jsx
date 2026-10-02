import { useState } from "react";
import { Sparkles } from "lucide-react";

/** Natural-language trip box: "Goa under 50k next weekend, veg food"
 *  -> POST /api/parse-trip -> merges fields into the trip form.
 *  Works offline via heuristic; Groq refines when the server has a key. */
export default function NaturalLanguageInput({ onFill }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const fill = async (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/parse-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't parse that trip.");
      const fields = data.fields || {};
      onFill?.(fields);
      const bits = [];
      if (fields.destination) bits.push(fields.destination);
      if (fields.budget) bits.push(`₹${Number(fields.budget).toLocaleString("en-IN")}`);
      if (fields.departure_date) bits.push(fields.departure_date);
      if (fields.travelers) bits.push(`${fields.travelers} traveler(s)`);
      setStatus(
        `Filled: ${bits.join(" · ") || "form updated"}${fields.diet ? ` · Food: ${fields.diet}` : ""}${fields.refined_by ? " (AI)" : ""}`
      );
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-5 rounded-2xl border border-clay/25 bg-clay/5 p-4 dark:border-white/10 dark:bg-white/5">
      {/* NOTE: plain div + button, NOT a <form> — this component renders
          inside TripForm's <form>, and nested forms are invalid HTML
          (the inner submit would fire the outer trip search instead). */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="nl-trip" className="sr-only">
          Describe your trip in plain words
        </label>
        <input
          id="nl-trip"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              fill();
            }
          }}
          maxLength={500}
          placeholder='Try: "Goa under 50k next weekend, 2 people, veg food"'
          autoComplete="off"
          className="tcc-focus h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-smoke/60 dark:border-white/15 dark:bg-ink dark:text-white"
        />
        <button
          type="button"
          onClick={fill}
          disabled={loading || !text.trim()}
          className="tcc-focus inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-clay px-5 text-sm font-semibold text-white hover:bg-clay-dark disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {loading ? "Reading…" : "Fill form"}
        </button>
      </div>
      {status && (
        <p className="mt-2 text-[13px] font-medium text-smoke dark:text-white/65" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
