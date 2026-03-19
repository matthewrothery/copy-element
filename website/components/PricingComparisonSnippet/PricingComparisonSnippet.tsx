import type { PricingComparisonSnippetProps } from "./types";
import "./PricingComparisonSnippet.css";

const wrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "normal",
  alignItems: "center",
  gap: 64,
  columnGap: 64,
  rowGap: 64,
  width: "100%",
  maxWidth: 1200,
  margin: "0 auto",
  color: "rgb(255, 255, 255)",
  fontFamily: 'system-ui, -apple-system, "SF Pro Display", "SF Pro", Inter, "Inter Fallback", sans-serif',
  fontSize: 16,
  fontWeight: 449,
  lineHeight: 24,
  backgroundColor: "rgb(0, 0, 0)",
  padding: "var(--space-5, 24px) 0",
  borderRadius: 12,
};

function PriceDigits({ digits }: { digits: string }) {
  return (
    <div className="bcsrst butkkW">
      {digits.split("").map((d, i) => (
        <div key={i} className="iOHIUr">
          <div className="cgMJfw">{d === "." ? "" : "0"}</div>
          <div className="fzdpFE">{d}</div>
        </div>
      ))}
    </div>
  );
}

function PricingCard({
  plan,
  priceDigits,
  priceWidth,
  subtext,
  primary,
}: {
  plan: "Monthly" | "Yearly";
  priceDigits: string;
  priceWidth: number;
  subtext: string;
  primary: boolean;
}) {
  return (
    <div className="idkvoa">
      <figure className={`caMPuQ ${plan === "Yearly" ? "show-trail" : ""}`}>
        <div className="cZKGOg">
          <div className="UFzIt" />
        </div>
        <div className="fQyoMZ">
          <div className="fpxFsr">
            <div className="plan-badges-row">
              <div className="bdVIyf">{plan}</div>
              {plan === "Yearly" && <div className="savings-badge">Save 53%</div>}
            </div>
            <div className="fZJebw">
              <div className="bMccnO">Element Armory</div>
              <p className="jpNrKr">All features included in both plans.</p>
            </div>
          </div>
          <div className="eTUWhE">
            <div className="hpZMss">
              <div className="eRTALC">
                <h3 className="hPfYki">
                  <div className="gFrVzn" style={{ width: priceWidth }}>
                    <div className="dSovOg">$</div>
                    <div className="irKGaY">
                      $
                      <PriceDigits digits={priceDigits} />
                    </div>
                  </div>
                </h3>
                <div className="dXCMoG">∕ month</div>
              </div>
              <div className="irGrpC">
                <div className="kxPTpI" style={{ position: "static", visibility: "hidden" as const }}>{subtext}</div>
                <div className="kxPTpI">{subtext}</div>
              </div>
            </div>
          </div>
          <div className="jFXGWN">
            <div
              tabIndex={-1}
              data-kind={primary ? "primary" : "subtle"}
              data-size="hero"
              className={primary ? "jJcxuY" : "Fwolr"}
              role="button"
            >
              <div className="eYNHBn hOvemU idle" />
              <div className="hXPxPx">Get Started</div>
            </div>
          </div>
          <div className="eWjlil" />
          <div className="gDiaFV">
            <div className="dkCiGU">
              <div className="dcsJIV">
                <div className="hLmPkB">
                  <div className="eSUeSB">
                    <div className="gLBKUq">
                      <span className="fnYGBG icon-material material-symbols-rounded" aria-hidden>
                        check
                      </span>
                    </div>
                    <div className="hapacs">Capture any web UI element</div>
                  </div>
                </div>
              </div>
              <div className="dcsJIV">
                <div className="hLmPkB">
                  <div className="eSUeSB">
                    <div className="gLBKUq">
                      <span className="fnYGBG icon-material material-symbols-rounded" aria-hidden>
                        check
                      </span>
                    </div>
                    <div className="hapacs">Export HTML &amp; React JSX</div>
                  </div>
                </div>
              </div>
              <div className="dcsJIV">
                <div className="hLmPkB">
                  <div className="eSUeSB">
                    <div className="gLBKUq">
                      <span className="fnYGBG icon-material material-symbols-rounded" aria-hidden>
                        check
                      </span>
                    </div>
                    <div className="hapacs">Unlimited snippet library saves</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </figure>
    </div>
  );
}

export function PricingComparisonSnippet({
  ariaLabel = "Screen Studio-style pricing comparison",
}: PricingComparisonSnippetProps = {}): React.ReactElement {
  return (
    <div className="pricing-comparison-snippet" aria-label={ariaLabel}>
      <div className="snippet-stage-parent" style={wrapperStyle}>
        <div className="diglTO" data-snippet-root>
          <PricingCard
            plan="Monthly"
            priceDigits="19"
            priceWidth={90.6094}
            subtext="Billed monthly. Switch to yearly anytime."
            primary={false}
          />
          <PricingCard
            plan="Yearly"
            priceDigits="9"
            priceWidth={60.4062}
            subtext="Billed yearly ($108/yr). Save $120 vs monthly."
            primary
          />
        </div>
      </div>
    </div>
  );
}
