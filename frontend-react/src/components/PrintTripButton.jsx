import { Printer } from "lucide-react";

/** 1-click day-wise export: opens the browser print dialog.
 *  Print CSS (index.css) hides nav/form/maps and shows the full
 *  day-by-day plan, so Save-as-PDF gives a clean trip sheet. */
export default function PrintTripButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="tcc-focus inline-flex h-9 items-center gap-2 rounded-[11px] px-3.5 text-[13px] font-semibold transition-colors hover:bg-white/10"
      style={{
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.13)",
        color: "var(--text-secondary)",
      }}
      title="Print or save this trip as PDF"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      <span className="hidden md:inline">Print / Save PDF</span>
      <span className="md:hidden">Print</span>
    </button>
  );
}
