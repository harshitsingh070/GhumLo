import { useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

const QUICK_PROMPTS = [
  "How can I reduce the cost?",
  "What should I pack?",
  "Best time to visit?",
  "Suggest top restaurants nearby",
  "Make this itinerary less tiring",
];

function renderAnswer(text) {
  const lines = String(text || "").split(/\r?\n/);
  return lines.map((line, index) => {
    const content = line.trim();
    if (!content) return <div key={index} className="h-2" aria-hidden="true" />;
    const isBullet = /^[-*]\s+/.test(content);
    const cleaned = content.replace(/^[-*]\s+/, "").replace(/^#{1,4}\s+/, "");
    const parts = cleaned.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    const formatted = parts.map((part, partIndex) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={partIndex} className="text-white font-bold">{part.slice(2, -2)}</strong>
      ) : (
        <span key={partIndex}>{part}</span>
      )
    );
    if (isBullet) {
      return <li key={index} className="ml-4 list-disc pl-1 text-slate-200">{formatted}</li>;
    }
    return <p key={index} className="mb-2 last:mb-0 text-slate-200">{formatted}</p>;
  });
}

export default function AITripAssistant({ plan }) {
  const [request, setRequest] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!plan) return null;

  const ask = async (prompt = request) => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setRequest(trimmed);
    // Drop the previous answer immediately so a new question never shows stale text.
    setAnswer("");
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: plan.destination,
          dates: `${plan.departure_date} to ${plan.return_date}`,
          itinerary: plan.itinerary,
          weather: plan.weather || null,
          request: trimmed,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Assistant request failed.");
      setAnswer(data.answer || "No answer returned.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="assistant"
      aria-label="AI trip assistant"
      className="glass-panel scroll-mt-24 rounded-[24px] p-6 sm:p-8 text-white"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "rgba(255, 114, 94, 0.18)", color: "var(--coral)" }}
          >
            <Bot className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--coral)" }}>
              AI Trip Assistant
            </p>
            <h2 className="font-display mt-1 text-2xl font-extrabold tracking-tight text-white">
              Ask anything about your {plan.destination || "trip"}
            </h2>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-slate-300">
              Personalized recommendations for activities, budgeting, food, weather, and schedule optimization.
            </p>
          </div>
        </div>
        <Sparkles className="h-5 w-5" style={{ color: "var(--coral)" }} aria-hidden="true" />
      </div>

      {/* Suggested Questions */}
      <div className="mt-5 flex flex-wrap gap-2.5">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => ask(prompt)}
            disabled={loading}
            className="tcc-focus rounded-full px-4 py-2 text-[13px] font-semibold text-slate-300 transition-colors hover:text-white disabled:opacity-50"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); ask(); }}>
        <input
          value={request}
          onChange={(event) => setRequest(event.target.value)}
          maxLength={600}
          placeholder="Ask anything about flights, itinerary, budget, restaurants..."
          className="tcc-focus h-12 min-w-0 flex-1 rounded-xl px-4 text-sm text-white placeholder-slate-400 outline-none focus:border-[var(--coral)]"
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
          }}
          aria-label="Ask the travel assistant about this trip"
        />
        <button
          type="submit"
          disabled={loading || !request.trim()}
          className="btn-primary h-12 w-12 shrink-0 rounded-xl"
          title="Ask assistant"
          aria-label="Ask assistant"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>

      {loading && (
        <div
          className="mt-4 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[13px] text-slate-300"
          role="status"
          style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.10)" }}
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
          Thinking through your {plan.destination || "trip"} plan…
        </div>
      )}
      {answer && (
        <div
          className="mt-4 rounded-2xl p-5 text-[14px] leading-relaxed shadow-sm animate-fade-rise"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.10)",
          }}
        >
          {renderAnswer(answer)}
        </div>
      )}
      {error && (
        <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-[var(--coral)]" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
