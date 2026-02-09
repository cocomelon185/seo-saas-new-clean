import React from "react";

const DEFAULT_SIZES = {
  desktop: "45vw",
  mobile: "100vw"
};

export default function ScreenshotGrid({ items, sizes = DEFAULT_SIZES }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="rp-screenshot-grid">
      {items.map((item) => (
        <figure key={item.key || item.title} className="rp-feature-shot rp-screenshot">
          {!item.hideMock && (
            <div className="rp-shot-mock" aria-hidden="true">
            <div className="rp-shot-mock-card">
              <div className="rp-shot-mock-kicker" />
              <div className="rp-shot-mock-title" />
              <div className="rp-shot-mock-line" />
              <div className="rp-shot-mock-line rp-shot-mock-line--short" />
            </div>
            <div className="rp-shot-mock-chart" />
            </div>
          )}
          <picture>
            {item.webp && (
              <source
                type="image/webp"
                srcSet={`${item.webp} 1x, ${item.webp.replace(".webp", "@2x.webp")} 2x`}
                sizes={`(min-width: 1024px) ${sizes.desktop}, ${sizes.mobile}`}
              />
            )}
            <img
              src={item.src}
              {...(item.srcSet
                ? {
                    srcSet: item.srcSet,
                    sizes: `(min-width: 1024px) ${sizes.desktop}, ${sizes.mobile}`
                  }
                : {})}
              alt={item.alt}
              loading={item.loading || "lazy"}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </picture>
          {(item.kicker || item.title) && (
            <figcaption className={item.hideMock ? "rp-shot-caption" : ""}>
              {item.kicker && <span className="rp-kicker text-white/85">{item.kicker}</span>}
              {item.title && <span className="mt-2 block text-lg font-semibold text-white">{item.title}</span>}
              {item.caption && <span className="mt-2 block text-xs text-white/90">{item.caption}</span>}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
