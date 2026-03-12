"use client";

import { useState, useCallback, useRef } from "react";

const BASE_PRICE_MONTH = 39;
const BASE_PRICE_YEAR = 69;

type TierConfig = {
  heading: string;
  labelTitle: string;
  subLabelTitle?: string;
  labels: string[];
  buttonLabels: string[];
  subLabels?: string[];
};

const TIERS: TierConfig[] = [
  {
    heading: "Atlas Pages",
    labelTitle: "Published Pages",
    subLabelTitle: "Included AI Photos",
    labels: [
      "Up to 5",
      "Up to 15",
      "Up to 25",
      "Up to 50",
      "Up to 75",
      "Up to 100",
      "Unlimited",
    ],
    buttonLabels: [
      "Included in base",
      "+$10/mo",
      "+$20/mo",
      "+$30/mo",
      "+$40/mo",
      "+$50/mo",
      "+$60/mo",
      "+$70/mo",
    ],
    subLabels: [
      "50/month",
      "100/month",
      "200/month",
      "250/month",
      "300/month",
      "350/month",
      "Unlimited",
    ],
  },
  {
    heading: "Atlas Bundler",
    labelTitle: "Additional Revenue Cap",
    labels: [
      "Up to $1,000",
      "Up to $2,500",
      "Up to $5,000",
      "Up to $10,000",
      "Up to $20,000",
      "Up to $35,000",
      "Up to $50,000",
      "$70,000+",
    ],
    buttonLabels: [
      "Included in base",
      "+$10/mo",
      "+$20/mo",
      "+$35/mo",
      "+$65/mo",
      "+$110/mo",
      "+$150/mo",
      "+$195/mo",
    ],
  },
  {
    heading: "Atlas Cart",
    labelTitle: "Total Store Orders",
    labels: [
      "Up to 250",
      "Up to 500",
      "Up to 1,000",
      "Up to 2,000",
      "Up to 3,500",
      "Up to 5,000",
      "6,500+",
    ],
    buttonLabels: [
      "Included in base",
      "+$10/mo",
      "+$20/mo",
      "+$30/mo",
      "+$60/mo",
      "+$100/mo",
      "+$150/mo",
    ],
  },
];

function useSlider(
  maxIndex: number,
  initialIndex = 0
): {
  index: number;
  setIndex: (i: number) => void;
  percent: number;
  trackRef: React.RefObject<HTMLDivElement | null>;
  handlePointerDown: (e: React.PointerEvent) => void;
  handleTrackPointerDown: (e: React.PointerEvent) => void;
} {
  const [index, setIndexState] = useState(initialIndex);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const clamp = useCallback(
    (i: number) => Math.max(0, Math.min(maxIndex, Math.round(i))),
    [maxIndex]
  );

  const setIndex = useCallback(
    (i: number) => setIndexState(clamp(i)),
    [clamp]
  );

  const percent = maxIndex <= 0 ? 0 : (index / maxIndex) * 100;

  const getIndexFromClientX = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track) return index;
      const rect = track.getBoundingClientRect();
      const x = clientX - rect.left;
      const w = rect.width;
      if (w <= 0) return index;
      const ratio = Math.max(0, Math.min(1, x / w));
      return clamp(ratio * maxIndex);
    },
    [index, maxIndex, clamp]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIndex(getIndexFromClientX(e.clientX));
      const target = e.target as HTMLElement;
      target.setPointerCapture?.(e.pointerId);
      const onMove = (e2: PointerEvent) => setIndex(getIndexFromClientX(e2.clientX));
      const onUp = () => {
        target.releasePointerCapture?.(e.pointerId);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [getIndexFromClientX, setIndex]
  );

  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest(".pricing-handle")) return;
      e.preventDefault();
      setIndex(getIndexFromClientX(e.clientX));
    },
    [getIndexFromClientX, setIndex]
  );

  return {
    index,
    setIndex,
    percent,
    trackRef,
    handlePointerDown,
    handleTrackPointerDown,
  };
}

function TierCard({
  config,
  initialIndex = 0,
}: {
  config: TierConfig;
  initialIndex?: number;
}): React.ReactElement {
  const maxIndex = config.labels.length - 1;
  const {
    index,
    setIndex,
    percent,
    trackRef,
    handlePointerDown,
    handleTrackPointerDown,
  } = useSlider(maxIndex, initialIndex);

  const label = config.labels[index] ?? config.labels[0];
  const buttonLabel = config.buttonLabels[index] ?? config.buttonLabels[0];
  const subLabel = config.subLabels?.[index] ?? config.subLabels?.[0];
  const isIncluded = index === 0;

  return (
    <div className="pricing-card-tier">
      <div className="pricing-heading">{config.heading}</div>
      <div className="pricing-wrap_with-cta">
        <div className="pricing-content">
          <div className="pricing_label-wrap">
            <div>{config.labelTitle}</div>
            <div>-</div>
            <div className="card-label">{label}</div>
          </div>
          <div className="pricing-range-wrap">
            <div className="range_with_handle">
              <div
                className="pricing-range-track"
                ref={trackRef}
                onPointerDown={handleTrackPointerDown}
              >
                <div
                  className="pricing-handle"
                  style={{ left: `${percent}%` }}
                  onPointerDown={handlePointerDown}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") {
                      e.preventDefault();
                      setIndex(index - 1);
                    } else if (e.key === "ArrowRight") {
                      e.preventDefault();
                      setIndex(index + 1);
                    }
                  }}
                  role="slider"
                  aria-valuenow={index}
                  aria-valuemin={0}
                  aria-valuemax={maxIndex}
                  aria-valuetext={label}
                  tabIndex={0}
                />
                <div
                  className="pricing-range-track-bg"
                  style={{ width: `${percent}%` }}
                />
                <div className="pricing-range" aria-hidden />
              </div>
            </div>
            <div className="range-points-wrap">
              {config.labels.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  data-index={i}
                  className={`slider-point ${i === index ? "is-active" : ""}`}
                  onClick={() => setIndex(i)}
                  aria-label={config.labels[i]}
                  aria-pressed={i === index}
                >
                  <div className={`range-point ${i <= index ? "is-filled" : ""}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
        {config.subLabelTitle != null && (
          <div className="pricing-info show-mobile">
            <div className="pricing_label-wrap">
              <div>{config.subLabelTitle}</div>
              <div>-</div>
              <div className="card-sub-label">{subLabel ?? ""}</div>
            </div>
          </div>
        )}
        <div
          className={`pricing-button ${isIncluded ? "disabled" : ""}`}
          aria-disabled={isIncluded}
        >
          <span className="pricing-button-text">{buttonLabel}</span>
        </div>
      </div>
      {config.subLabelTitle != null && (
        <div className="pricing-info hide-mobile">
          <div className="pricing_label-wrap">
            <div>{config.subLabelTitle}</div>
            <div>-</div>
            <div className="card-sub-label">{subLabel ?? ""}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PricingBlock(): React.ReactElement {
  return (
    <div className="pricing-cards-wrap">
      <div className="pricing-card-base">
        <div className="pricing-card-top-info">
          <div className="part-pricing title-size">
            <h3 className="h6 text-color-white">Atlas Base Plan</h3>
          </div>
          <div className="part-pricing new">
            <div className="price-wrapper alt">
              <span className="number alt">$</span>
              <span data-year={BASE_PRICE_YEAR} data-month={BASE_PRICE_MONTH} className="number alt">
                {BASE_PRICE_MONTH}
              </span>
              <span className="checkbox-text padding-bot text-color-white">/month</span>
            </div>
            <div className="button-group full-width-left">
              <a href="#" className="button is-brand is-icon pricing-cta">
                <span className="text-block-14">Get started</span>
                <span className="arrow-wrapper" aria-hidden>
                  <span className="arrow-line" />
                </span>
              </a>
            </div>
            <div className="pricing-paragraph new">
              <p className="par _12px align-left text-color-gray">
                You’ll be charged the base plan fees and given access to features to a limit, any
                additional uses for those features can be purchased as shown in the per feature
                pricing.
              </p>
            </div>
          </div>
        </div>
        <div className="line is-white is-pricing" />
        <div className="pricing-card-features">
          {[
            { name: "Published Pages", value: "Up to 5 pages" },
            { name: "Al Photos", value: "25/month" },
            { name: "Bundle Revenue", value: "Up to $1,000" },
            { name: "Cart Orders", value: "Up to 250" },
            { name: "Al Store Builder", check: true },
            { name: "Al Page Builder", check: true },
            { name: "Al Photo Generator", check: true },
            { name: "Bundler Upsells", check: true },
            { name: "Cart Upsells", check: true },
          ].map((f) => (
            <div key={f.name} className="pricing-card-feature-item">
              <div>{f.name}</div>
              {"value" in f ? (
                <div className="text-color-white">{f.value}</div>
              ) : (
                <span className="checkbox-image new" aria-hidden>
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="pricing-cards-vertical">
        {TIERS.map((tier) => (
          <TierCard key={tier.heading} config={tier} />
        ))}
      </div>
    </div>
  );
}
