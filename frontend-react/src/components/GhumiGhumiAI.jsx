import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";

const QUICK_PROMPTS = [
  "How can I reduce the cost?",
  "What should I pack?",
  "Best time to visit?",
  "Suggest top restaurants nearby",
  "Make this itinerary less tiring",
];

/** Lightweight markdown-lite renderer (bold + bullets), same as the old inline assistant. */
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

/** Floating right-side chat box. Replaces the old full-width AI Trip Assistant
 *  section — same /api/assistant backend, same suggestion chips, now docked
 *  bottom-right under the "Ghumi Ghumi AI" name. Hidden in print via .no-print. */
export default function GhumiGhumiAI({ plan }) {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  // External "AI Guide" entry points dispatch `open-ghumi-chat` to bring
  // the box back. (Fresh trips remount via key={plan.destination} in App,
  // so no destination effect is needed here.)
  useEffect(() => {
    const opener = () => setOpen(true);
    window.addEventListener("open-ghumi-chat", opener);
    return () => window.removeEventListener("open-ghumi-chat", opener);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, open]);

  const ask = useCallback(async (prompt) => {
    const trimmed = String(prompt ?? "").trim();
    if (!trimmed || loading || !plan) return;
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setLoading(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: plan.destination,
          dates: `${plan.departure_date} to ${plan.return_date}`,
          itinerary: plan.itinerary,
          weather: plan.weather || null,
          // Grounded price data so "cheapest flight / budget" questions are
          // answered from this trip's real numbers, never invented.
          trip_prices: {
            budget: plan.budget,
            remaining_budget: plan.remaining_budget,
            fits_budget: plan.fits_budget,
            best_pick: plan.best_pick,
            other_options: plan.other_options,
          },
          request: trimmed,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Assistant request failed.");
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer || "No answer returned." }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loading, plan]);

  if (!plan) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Ghumi Ghumi AI chat"
        className="tcc-focus no-print fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full py-3 pl-4 pr-5 text-[14px] font-bold text-white shadow-xl transition-transform hover:-translate-y-0.5 sm:bottom-6 sm:right-6"
        style={{ background: "var(--coral)", boxShadow: "0 18px 45px rgba(0,0,0,0.45)" }}
      >
        <Bot className="h-5 w-5" aria-hidden="true" />
        Ghumi Ghumi AI
      </button>
    );
  }

  return (
    <aside
      id="ghumi-chat"
      aria-label="Ghumi Ghumi AI chat"
      className="no-print fixed bottom-4 right-4 z-50 flex w-[min(320px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[20px] text-white sm:bottom-6 sm:right-6"
      style={{
        background: "rgba(9, 38, 48, 0.96)",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        height: "min(720px, calc(100dvh - 5rem))",
        maxHeight: "min(720px, calc(100dvh - 5rem))",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="flex min-w-0 gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(255, 114, 94, 0.18)", color: "var(--coral)" }}
          >
            <Bot className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--coral)" }}>
              Ghumi Ghumi AI
            </p>
            <h2 className="font-display mt-0.5 truncate text-[17px] font-extrabold tracking-tight text-white">
              Ask about {plan.destination || "trip"}
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Sparkles className="h-4 w-4" style={{ color: "var(--coral)" }} aria-hidden="true" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Minimize Ghumi Ghumi AI chat"
            className="tcc-focus flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 px-4 sm:px-5" aria-label="Suggested questions">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => ask(prompt)}
            disabled={loading}
            className="tcc-focus rounded-full px-3 py-1.5 text-[12px] font-semibold text-slate-300 transition-colors hover:text-white disabled:opacity-50"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Ghumi Ghumi AI conversation"
        className="mx-4 mt-3 min-h-[160px] flex-1 space-y-2.5 overflow-y-auto rounded-xl p-3 sm:mx-5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {messages.length === 0 && !loading && (
          <p className="text-[13px] leading-relaxed text-slate-400">
            Hi! I know your {plan.destination || "trip"} plan — pick a suggestion above or ask me anything.
          </p>
        )}
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <p
              key={i}
              className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md px-3.5 py-2 text-[13px] font-medium text-white"
              style={{ background: "rgba(255, 114, 94, 0.85)" }}
            >
              {msg.text}
            </p>
          ) : (
            <div
              key={i}
              className="w-fit max-w-full rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] leading-relaxed"
              style={{ background: "rgba(255, 255, 255, 0.06)" }}
            >
              {renderAnswer(msg.text)}
            </div>
          )
        )}
        {loading && (
          <p className="flex items-center gap-2 text-[13px] text-slate-300" role="status">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
            Thinking through your {plan.destination || "trip"} plan…
          </p>
        )}
      </div>
      {error && (
        <p className="mx-4 mt-2 rounded-xl bg-red-500/10 p-2.5 text-[13px] text-[var(--coral)] sm:mx-5" role="alert">
          {error}
        </p>
      )}

      {/* Input */}
      <form
        className="flex gap-2 p-4 sm:p-5 sm:pt-4"
        onSubmit={(event) => { event.preventDefault(); ask(input); }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={600}
          placeholder="Ask anything about flights, itinerary, budget, restaurants..."
          className="tcc-focus h-11 min-w-0 flex-1 rounded-xl px-3.5 text-sm text-white placeholder-slate-400 outline-none focus:border-[var(--coral)]"
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
          }}
          aria-label="Ask Ghumi Ghumi AI about this trip"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary h-11 w-11 shrink-0 rounded-xl"
          title="Ask Ghumi Ghumi AI"
          aria-label="Ask Ghumi Ghumi AI"
        >
          {loading ? (
            <span className="mx-auto block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Send className="mx-auto h-4 w-4" />
          )}
        </button>
      </form>
    </aside>
  );
}
