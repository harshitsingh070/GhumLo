import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { apiRequest, friendlyError } from "../lib/api.js";
import { ButtonSpinner, InlineThinking } from "./Loader.jsx";
import { InlineError } from "./ErrorState.jsx";

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
        <strong key={partIndex} className="font-bold text-[#102A43]">{part.slice(2, -2)}</strong>
      ) : (
        <span key={partIndex}>{part}</span>
      )
    );
    if (isBullet) {
      return <li key={index} className="ml-4 list-disc pl-1 text-[#52606D]">{formatted}</li>;
    }
    return <p key={index} className="mb-2 last:mb-0 text-[#52606D]">{formatted}</p>;
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
  // Same-tick double-submit guard (`loading` only flips after re-render) +
  // in-flight abort so only the latest request updates the conversation.
  const submittingRef = useRef(false);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

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
    if (!trimmed || loading || submittingRef.current || !plan) return;
    submittingRef.current = true;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setLoading(true);
    try {
      const data = await apiRequest("/api/assistant", {
        method: "POST",
        timeoutMs: 60000,
        signal: ctrl.signal,
        body: {
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
        },
      });
      if (!ctrl.signal.aborted) {
        setMessages((prev) => [...prev, { role: "assistant", text: data.answer || "No answer returned." }]);
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        setError(friendlyError(err, "Assistant request failed. Please try again."));
      }
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null;
        submittingRef.current = false;
      }
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
        className="tcc-focus no-print fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full py-3 pl-4 pr-5 t-btn text-white shadow-xl transition-transform hover:-translate-y-0.5 sm:bottom-6 sm:right-6"
        style={{ background: "#FF6B57", boxShadow: "0 8px 24px rgba(255, 107, 87, 0.35)" }}
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
      className="no-print fixed bottom-4 right-4 z-50 flex w-[min(320px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[20px] text-[#102A43] sm:bottom-6 sm:right-6"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
        height: "min(720px, calc(100dvh - 5rem))",
        maxHeight: "min(720px, calc(100dvh - 5rem))",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 bg-white p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="flex min-w-0 gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "#FFF1EE", color: "#FF6B57" }}
          >
            <Bot className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="t-badge uppercase text-[#5B6B7B]">
              Ghoomlo Beta
            </p>
            <h2 className="font-display mt-0.5 truncate t-card-lg text-[#102A43]">
              Ask about {plan.destination || "trip"}
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Sparkles className="h-4 w-4 text-[#8B5CF6]" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Minimize Ghumi Ghumi AI chat"
            className="tcc-focus tcc-touch flex h-11 w-11 items-center justify-center rounded-full text-[#5B6B7B] hover:bg-[#F1F5F9] hover:text-[#102A43]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 bg-white px-4 sm:px-5" aria-label="Suggested questions">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => ask(prompt)}
            disabled={loading}
            className="tcc-focus tcc-touch rounded-full px-3 py-1.5 t-btn-sm text-[#52606D] transition-colors hover:border-[#FF6B57] hover:bg-[#FFF1EE] hover:text-[#FF6B57] disabled:opacity-50"
            style={{
              background: "#F1F5F9",
              border: "1px solid #E5E7EB",
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
        className="mx-4 mt-3 min-h-[160px] flex-1 space-y-2.5 overflow-y-auto rounded-xl bg-[#F7F9FC] p-3 sm:mx-5"
        style={{ border: "1px solid #EEF2F6" }}
      >
        {messages.length === 0 && !loading && (
          <p className="t-small text-[#5B6B7B]" style={{ lineHeight: 1.5 }}>
            Hi! I know your {plan.destination || "trip"} plan — pick a suggestion above or ask me anything.
          </p>
        )}
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <p
              key={i}
              className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-[#FF6B57] px-3.5 py-2 t-small text-white"
              style={{ lineHeight: 1.5 }}
            >
              {msg.text}
            </p>
          ) : (
            <div
              key={i}
              className="w-fit max-w-full rounded-2xl rounded-bl-md bg-[#F1F5F9] px-3.5 py-2.5 t-small text-[#102A43]"
              style={{ lineHeight: 1.5 }}
            >
              {renderAnswer(msg.text)}
            </div>
          )
        )}
        {loading && (
          <InlineThinking label={`Thinking through your ${plan.destination || "trip"} plan…`} />
        )}
      </div>
      {error && (
        <div className="mx-4 mt-2 sm:mx-5">
          <InlineError message={error} />
        </div>
      )}

      {/* Input */}
      <form
        className="flex gap-2 bg-white p-4 sm:p-5 sm:pt-4"
        onSubmit={(event) => { event.preventDefault(); ask(input); }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={600}
          placeholder="Ask anything about flights, itinerary, budget, restaurants..."
          className="tcc-focus h-11 min-w-0 flex-1 rounded-xl bg-[#F7F9FC] px-3.5 t-input text-[#102A43] placeholder-[#5B6B7B] outline-none focus:border-[#FF6B57]"
          style={{
            border: "1px solid #E5E7EB",
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
            <ButtonSpinner />
          ) : (
            <Send className="mx-auto h-4 w-4" />
          )}
        </button>
      </form>
    </aside>
  );
}
