import { describe, expect, it } from "vitest";
import { resolvePlan } from "./plan-resolver";

describe("resolvePlan", () => {
  it("returns guest when not signed in", () => {
    expect(resolvePlan({ signed_in: false, user_email: null, user_plan: null })).toBe("guest");
    expect(resolvePlan({ signed_in: false, user_email: "a@b.com", user_plan: "pro" })).toBe("guest");
  });

  it("returns pro when signed in with pro plan", () => {
    expect(resolvePlan({ signed_in: true, user_email: "a@b.com", user_plan: "pro" })).toBe("pro");
    expect(resolvePlan({ signed_in: true, user_email: "a@b.com", user_plan: "PRO" })).toBe("pro");
  });

  it("returns free when signed in with free plan", () => {
    expect(resolvePlan({ signed_in: true, user_email: "a@b.com", user_plan: "free" })).toBe("free");
  });

  it("returns free when signed in with null plan", () => {
    expect(resolvePlan({ signed_in: true, user_email: "a@b.com", user_plan: null })).toBe("free");
  });

  it("returns free for unknown plan strings", () => {
    expect(resolvePlan({ signed_in: true, user_email: "a@b.com", user_plan: "enterprise" })).toBe("free");
  });
});
