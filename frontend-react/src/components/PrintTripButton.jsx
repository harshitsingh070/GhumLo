import { useState } from "react";
import { Printer } from "lucide-react";

/** 1-click day-wise export: opens the browser print dialog.
 *  Print CSS (index.css) hides nav/form/maps and shows the full
 *  day-by-day plan, so Save-as-PDF gives a clean trip sheet. */
export default function PrintTripButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="tcc-focus inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-sand dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
      title="Print or save this trip as PDF"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      Print / Save PDF
    </button>
  );
}
