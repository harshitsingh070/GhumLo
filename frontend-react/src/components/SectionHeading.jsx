/** Reusable section heading: eyebrow + display title + subtitle.
 *  Props: eyebrow, title, subtitle, align ("left"|"center"), dark (bool). */
import Reveal from "./Reveal.jsx";

export default function SectionHeading({ eyebrow, title, subtitle, align = "left", dark = false }) {
  const alignCls = align === "center" ? "text-center mx-auto items-center" : "text-left items-start";
  return (
    <Reveal>
      <div className={`flex max-w-2xl flex-col gap-3 ${alignCls}`}>
      {eyebrow && (
        <p
          className={`text-xs font-bold uppercase tracking-[0.18em] ${
            dark ? "text-white/60" : "text-clay"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-4xl ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base leading-relaxed sm:text-lg ${dark ? "text-white/70" : "text-smoke"}`}>
          {subtitle}
        </p>
      )}
      </div>
    </Reveal>
  );
}
