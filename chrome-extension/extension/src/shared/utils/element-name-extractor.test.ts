import { describe, expect, it } from "vitest";
import { extractElementName } from "./element-name-extractor";

function el(html: string): Element {
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  const first = wrap.firstElementChild;
  if (!first) throw new Error("No element in HTML");
  return first;
}

describe("extractElementName", () => {
  it("uses aria-label for button", () => {
    const result = extractElementName(
      el('<button aria-label="Add to cart">Add</button>')
    );
    expect(result.machineName).toBe("add-to-cart-button");
    expect(result.displayName).toBe("Add To Cart Button");
    expect(result.source).toBe("attribute:aria-label");
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it("uses placeholder for input", () => {
    const result = extractElementName(
      el('<input class="form-control" placeholder="Email address" />')
    );
    expect(result.machineName).toBe("email-address-input");
    expect(result.displayName).toBe("Email Address Input");
    expect(result.source).toContain("attribute");
  });

  it("uses visible text for button", () => {
    const result = extractElementName(
      el('<button class="cta primary-btn">Start free trial</button>')
    );
    expect(result.machineName).toBe("start-free-trial-button");
    expect(result.displayName).toBe("Start Free Trial Button");
    expect(result.source).toBe("text");
  });

  it("uses visible text for link", () => {
    const result = extractElementName(
      el('<a href="/pricing" class="nav-link">Pricing</a>')
    );
    expect(result.machineName).toBe("pricing-link");
    expect(result.displayName).toBe("Pricing Link");
    expect(result.source).toBe("text");
  });

  it("uses cleaned class tokens for div without text", () => {
    const result = extractElementName(
      el('<div class="pricing-card hero-cta"></div>')
    );
    expect(result.machineName).toBe("pricing-card-hero-container");
    expect(result.displayName).toBe("Pricing Card Hero Container");
    expect(result.source).toBe("class");
  });

  it("uses id when present and no better signal", () => {
    const result = extractElementName(
      el('<button id="submit-order-btn">Submit</button>')
    );
    expect(result.machineName).toBe("submit-order-btn-button");
    expect(result.displayName).toBe("Submit Order Btn Button");
    expect(result.source).toBe("attribute:id");
  });

  it("prefers aria-label over text", () => {
    const result = extractElementName(
      el('<button aria-label="Close dialog">X</button>')
    );
    expect(result.machineName).toBe("close-dialog-button");
    expect(result.source).toBe("attribute:aria-label");
  });

  it("prefers data-testid when present", () => {
    const result = extractElementName(
      el('<button data-testid="login-submit">Sign in</button>')
    );
    expect(result.machineName).toBe("login-submit-button");
    expect(result.source).toBe("attribute:data-testid");
  });

  it("does not use very long text", () => {
    const long =
      "This is a very long button label that exceeds the maximum allowed length for visible text content extraction";
    const result = extractElementName(el(`<button>${long}</button>`));
    expect(result.source).not.toBe("text");
    expect(result.machineName).toBe("button");
  });

  it("returns tag suffix for generic div with no signals", () => {
    const result = extractElementName(el('<div class="css-xyz123 wrapper"></div>'));
    expect(result.machineName).toBe("container");
    expect(result.displayName).toBe("Container");
    expect(result.source).toBe("fallback");
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("uses parent context when element has no text or useful attributes", () => {
    document.body.innerHTML = `
      <div class="pricing-card">
        <button></button>
      </div>
    `;
    const target = document.querySelector(".pricing-card button")!;
    const result = extractElementName(target);
    expect(result.machineName).toBe("pricing-button");
    expect(result.source).toBe("parent-context");
    document.body.innerHTML = "";
  });

  it("strips noisy class patterns", () => {
    const result = extractElementName(
      el('<div class="sc-abc123 chakra-button__inner mt-4 flex">Primary</div>')
    );
    expect(result.machineName).toBe("primary-container");
    expect(result.source).toBe("text");
  });

  it("appends correct suffix for img with alt", () => {
    const result = extractElementName(
      el('<img src="/logo.png" alt="Company logo" />')
    );
    expect(result.machineName).toBe("company-logo-image");
    expect(result.displayName).toBe("Company Logo Image");
  });

  it("uses class for nav and does not duplicate suffix when class already ends with it", () => {
    const result = extractElementName(el('<nav class="main-nav">...</nav>'));
    expect(result.machineName).toBe("main-nav");
    expect(result.displayName).toBe("Main Nav");
    expect(result.source).toBe("class");
  });
});
