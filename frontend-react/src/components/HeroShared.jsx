/** Shared hero primitives — single visual system for Hero + TripHero.
 *  Eyebrow, veil, and shell live here so the two heroes cannot drift. */
export function HeroEyebrow({ children }) {
  return (
    <p
      className="t-badge mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 uppercase"
      style={{ background: "var(--color-brand-bg)", border: "1px solid var(--color-brand-border)", color: "var(--color-brand-hover)" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-brand)" }} aria-hidden="true" />
      {children}
    </p>
  );
}

export function HeroVeil() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(to right, rgba(247,249,252,0.58) 0%, rgba(247,249,252,0.38) 30%, rgba(247,249,252,0.14) 58%, rgba(247,249,252,0.03) 82%, rgba(247,249,252,0) 100%)",
      }}
      aria-hidden="true"
    />
  );
}

export function HeroShell({ id, minHeight = "clamp(560px, 80vh, 700px)", children }) {
  return (
    <section id={id} className="relative scroll-mt-[92px] overflow-hidden" style={{ minHeight }}>
      {children}
    </section>
  );
}
