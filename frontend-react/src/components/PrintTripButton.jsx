import { Printer } from "lucide-react";

/** 1-click day-wise export: opens the browser print dialog.
 *  Print CSS (index.css) hides nav/form/maps and shows the full
 *  day-by-day plan, so Save-as-PDF gives a clean trip sheet. */
export default function PrintTripButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="tcc-focus inline-flex h-9 items-center gap-2 rounded-[11px] bg-[#F1F5F9] px-3.5 t-btn text-[#102A43] transition-colors hover:border-[#FF6B57] hover:bg-[#FFF1EE] hover:text-[#FF6B57]"
      style={{
        border: "1px solid #E5E7EB",
      }}
      title="Print or save this trip as PDF"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      <span className="hidden md:inline">Print / Save PDF</span>
      <span className="md:hidden">Print</span>
    </button>
  );
}
