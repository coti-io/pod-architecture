import type { BlockMeta } from "../data/pod-flow";

type ZoomableBlockProps = {
  meta: BlockMeta;
  focused: boolean;
  dimmed: boolean;
  onFocus: () => void;
  onBlur: () => void;
  children: React.ReactNode;
};

export default function ZoomableBlock({
  meta,
  focused,
  dimmed,
  onFocus,
  onBlur,
  children,
}: ZoomableBlockProps) {
  return (
    <section
      className={[
        "zoomable-block",
        focused ? "zoomable-block--focused" : "",
        dimmed ? "zoomable-block--dimmed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--block-accent": meta.accent } as React.CSSProperties}
    >
      <header className="zoomable-block__header">
        <button
          type="button"
          className="zoomable-block__title-btn"
          onClick={focused ? onBlur : onFocus}
          aria-expanded={focused}
        >
          <span className="zoomable-block__accent" aria-hidden />
          <span>
            <strong>{meta.title}</strong>
            <span className="zoomable-block__subtitle">{meta.subtitle}</span>
          </span>
        </button>
        {focused && (
          <button type="button" className="ghost-btn" onClick={onBlur}>
            Back
          </button>
        )}
      </header>
      <div className="zoomable-block__body">{children}</div>
    </section>
  );
}
