/** Reusable section heading: eyebrow + display title + subtitle.
 *  Light-only theme: navy title, gray subtitle, coral eyebrow.
 *  Type scale: 24px/700 section title, 14px/400 subtitle, 11px/600 eyebrow. */
import Reveal from "./Reveal.jsx";

export default function SectionHeading({ eyebrow, title, subtitle, align = "left" }) {
  const alignCls = align === "center" ? "text-center mx-auto items-center" : "text-left items-start";
  return (
    <Reveal>
      <div className={`flex max-w-2xl flex-col gap-2 ${alignCls}`}>
      {eyebrow && (
        <p className="t-badge uppercase" style={{ color: "#FF6B57" }}>
          {eyebrow}
        </p>
      )}
      <h2
        className="t-section"
        style={{ color: "#102A43" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="t-body"
          style={{ color: "#52606D" }}
        >
          {subtitle}
        </p>
      )}
      </div>
    </Reveal>
  );
}
