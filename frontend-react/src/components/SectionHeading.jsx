/** Reusable section heading: eyebrow + display title + subtitle.
 *  Props: eyebrow, title, subtitle, align ("left"|"center"), dark (bool).
 *  The app is always dark — `dark` is kept for API compatibility. */
import Reveal from "./Reveal.jsx";

export default function SectionHeading({ eyebrow, title, subtitle, align = "left", dark = true }) {
  const alignCls = align === "center" ? "text-center mx-auto items-center" : "text-left items-start";
  return (
    <Reveal>
      <div className={`flex max-w-2xl flex-col gap-3 ${alignCls}`}>
      {eyebrow && (
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--coral)]">
          {eyebrow}
        </p>
      )}
      <h2
        className="font-display text-[26px] font-extrabold leading-[1.12] tracking-[-0.025em] sm:text-[32px]"
        style={{ color: dark ? "var(--text-primary)" : undefined }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="text-[15px] leading-relaxed sm:text-base"
          style={{ color: dark ? "var(--text-secondary)" : undefined }}
        >
          {subtitle}
        </p>
      )}
      </div>
    </Reveal>
  );
}
