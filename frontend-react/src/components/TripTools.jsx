import { useState } from "react";
import {
  TrendingDown,
  Luggage,
  SunMedium,
  FileText,
  UtensilsCrossed,
  Video,
  Check,
  X,
} from "lucide-react";

/** 2x3 Grid of Trip Tools matching the reference design.
 *  Interactive actions: smooth scroll or interactive modal. */
export default function TripTools({ destination, onSelectTool }) {
  const [showPacking, setShowPacking] = useState(false);
  const [packingItems, setPackingItems] = useState([
    { id: 1, name: "Passport & Visa copies", checked: true },
    { id: 2, name: "Sunscreen & Sunglasses", checked: true },
    { id: 3, name: "Light breathable clothes", checked: false },
    { id: 4, name: "Universal power adapter", checked: false },
    { id: 5, name: "Comfortable walking shoes", checked: false },
    { id: 6, name: "Swimwear / Beach gear", checked: false },
    { id: 7, name: "Emergency cash / Forex card", checked: false },
  ]);

  const togglePackingItem = (id) => {
    setPackingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleToolClick = (toolId) => {
    if (toolId === "packing") {
      setShowPacking(true);
      return;
    }
    if (toolId === "cost") {
      document.getElementById("savings")?.scrollIntoView({ behavior: "smooth" }) ||
        document.getElementById("trip-budget-card")?.scrollIntoView({ behavior: "smooth" });
    } else if (toolId === "weather") {
      document.getElementById("weather")?.scrollIntoView({ behavior: "smooth" });
    } else if (toolId === "visa") {
      document.getElementById("know")?.scrollIntoView({ behavior: "smooth" });
    } else if (toolId === "restaurants") {
      document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
    } else if (toolId === "videos") {
      document.getElementById("vlogs")?.scrollIntoView({ behavior: "smooth" });
    }
    if (onSelectTool) onSelectTool(toolId);
  };

  const tools = [
    {
      id: "cost",
      title: "Cost Optimizer",
      desc: "Save up to 30%",
      icon: TrendingDown,
      color: "#43D17C",
      bg: "rgba(67, 209, 124, 0.15)",
    },
    {
      id: "packing",
      title: "Packing List",
      desc: "Smart checklist",
      icon: Luggage,
      color: "#48B8FF",
      bg: "rgba(72, 184, 255, 0.15)",
    },
    {
      id: "weather",
      title: "Weather",
      desc: "Live forecast",
      icon: SunMedium,
      color: "#F7C948",
      bg: "rgba(247, 201, 72, 0.15)",
    },
    {
      id: "visa",
      title: "Visa Information",
      desc: "Entry requirements",
      icon: FileText,
      color: "#B794F4",
      bg: "rgba(183, 148, 244, 0.15)",
    },
    {
      id: "restaurants",
      title: "Restaurants",
      desc: "Top rated places",
      icon: UtensilsCrossed,
      color: "#FF725E",
      bg: "rgba(255, 114, 94, 0.15)",
    },
    {
      id: "videos",
      title: "YouTube Videos",
      desc: "Travel guides",
      icon: Video,
      color: "#FF4D4D",
      bg: "rgba(255, 77, 77, 0.15)",
    },
  ];

  return (
    <>
      <section
        id="trip-tools"
        aria-label="Trip Tools"
        className="glass-panel min-w-0 w-full scroll-mt-24 self-start overflow-hidden rounded-[24px] p-5 sm:p-6 text-white"
        style={{
          background: "rgba(9, 38, 48, 0.88)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="font-display min-w-0 text-xl font-bold tracking-tight text-white">
            Trip Tools
          </h2>
          <button
            type="button"
            onClick={() => handleToolClick("cost")}
            className="text-[12px] font-semibold text-slate-400 hover:text-[var(--coral)]"
          >
            View all tools →
          </button>
        </div>

        {/* Responsive grid per spec §20: 3×2 desktop, 2-col tablet,
            2-col mobile (tiles stay readable at ~150px+). The panel wraps
            this grid naturally and ends 20–24px below the last row. */}
        <div className="grid grid-cols-2 gap-2.5 min-[1376px]:grid-cols-3">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleToolClick(t.id)}
                className="tcc-focus group flex items-center gap-3.5 rounded-[16px] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:bg-white/10"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                }}
              >
                {/* Icon square */}
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ background: t.bg, color: t.color }}
                >
                  <Icon className="h-5 w-5" />
                </span>

                {/* Text */}
                <div className="min-w-0">
                  <p className="text-[13px] font-bold leading-tight text-white group-hover:text-[var(--coral)]">
                    {t.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                    {t.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Packing Checklist Modal ── */}
      {showPacking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="glass-panel w-full max-w-md rounded-[24px] p-6 text-white"
            style={{ background: "rgba(9, 38, 48, 0.96)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                  <Luggage className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">
                    Packing Checklist
                  </h3>
                  <p className="text-xs text-slate-400">
                    Smart checklist for {destination || "your trip"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPacking(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="mt-5 space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {packingItems.map((item) => (
                <li
                  key={item.id}
                  onClick={() => togglePackingItem(item.id)}
                  className="flex cursor-pointer items-center justify-between rounded-xl p-3 transition-colors hover:bg-white/5"
                  style={{
                    background: item.checked ? "rgba(32, 199, 201, 0.08)" : "rgba(255, 255, 255, 0.03)",
                    border: item.checked
                      ? "1px solid rgba(32, 199, 201, 0.25)"
                      : "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <span
                    className={`text-[13px] ${
                      item.checked ? "line-through text-slate-400" : "text-white font-medium"
                    }`}
                  >
                    {item.name}
                  </span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs ${
                      item.checked
                        ? "border-[var(--teal)] bg-[var(--teal)] text-slate-900"
                        : "border-white/30"
                    }`}
                  >
                    {item.checked && <Check className="h-3.5 w-3.5 font-bold" />}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPacking(false)}
                className="btn-primary px-6 py-2.5 text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
