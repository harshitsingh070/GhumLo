import { useState } from "react";
import { Bot, CloudSun, Droplets, Send, Sparkles, Wind } from "lucide-react";

const QUICK_PROMPTS = ["Make this itinerary less tiring", "Plan around today's weather", "What should I pack?"];

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
        <strong key={partIndex}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={partIndex}>{part}</span>
      )
    );
    if (isBullet) {
      return <li key={index} className="ml-4 list-disc pl-1">{formatted}</li>;
    }
    return <p key={index} className="mb-2 last:mb-0">{formatted}</p>;
  });
}

export default function AITripAssistant({ plan }) {
  const [request, setRequest] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!plan) return null;
  const weather = plan.weather;

  const ask = async (prompt = request) => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setRequest(trimmed);
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
    <section id="assistant" aria-label="AI trip assistant" className="tcc-ai-panel scroll-mt-36 rounded-[20px] border border-clay/25 p-6 shadow-card sm:p-7 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clay text-white"><Bot className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">Powered by Groq</p>
            <h2 className="font-display mt-1 text-xl font-extrabold text-ink dark:text-white">Ask about your itinerary</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-smoke dark:text-white/60">Get practical changes based on this trip, not generic travel advice.</p>
          </div>
        </div>
        <Sparkles className="h-5 w-5 text-clay" aria-hidden="true" />
      </div>

      {weather && (weather.temperature || weather.condition) && (
        <div className="tcc-weather-chip mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-3.5 py-2.5 text-xs text-smoke dark:text-white/65">
          <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-ink dark:text-white">
            <CloudSun className="h-4 w-4 text-clay" />
            Weather context
          </span>
          <span className="font-semibold text-ink dark:text-white">{weather.temperature}{weather.unit ? `°${String(weather.unit).charAt(0)}` : ""} · {weather.condition}</span>
          {weather.humidity && <span className="inline-flex items-center gap-1"><Droplets className="h-3.5 w-3.5" /> {weather.humidity}</span>}
          {weather.wind && <span className="inline-flex items-center gap-1"><Wind className="h-3.5 w-3.5" /> {weather.wind}</span>}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <button key={prompt} type="button" onClick={() => ask(prompt)} disabled={loading} className="tcc-focus rounded-full border border-clay/25 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-clay hover:text-clay disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white">
            {prompt}
          </button>
        ))}
      </div>

      <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); ask(); }}>
        <input value={request} onChange={(event) => setRequest(event.target.value)} maxLength={600} placeholder="e.g. Replace the busiest day with a relaxed plan" className="tcc-focus h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-smoke/60 dark:border-white/15 dark:bg-ink dark:text-white" aria-label="Ask the travel assistant" />
        <button type="submit" disabled={loading || !request.trim()} className="tcc-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clay text-white hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50" title="Ask assistant" aria-label="Ask assistant">
          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send className="h-4 w-4" />}
        </button>
      </form>

      {answer && <div className="mt-4 rounded-2xl border border-line bg-white p-5 text-[15px] leading-7 text-ink shadow-sm dark:border-white/10 dark:bg-ink dark:text-white/80">{renderAnswer(answer)}</div>}
      {error && <p className="mt-3 rounded-xl bg-clay/10 p-3 text-sm text-clay" role="alert">{error}</p>}
    </section>
  );
}
