"use client";

import { useState } from "react";
import "./UninstallFeedback.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const REASONS: { value: string; label: string }[] = [
  { value: "not-using", label: "I don't use it enough" },
  { value: "not-working", label: "It didn't work as expected" },
  { value: "better-tool", label: "I found a better tool" },
  { value: "privacy", label: "Privacy or security concerns" },
  { value: "too-complex", label: "Too complex / too many features" },
  { value: "just-testing", label: "Just testing, don't need it" },
  { value: "other", label: "Other" },
];

type FormState = "idle" | "submitting" | "success" | "error";

export function UninstallFeedback(): React.ReactElement {
  const [reason, setReason] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [state, setState] = useState<FormState>("idle");

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!reason) return;

    setState("submitting");
    try {
      const res = await fetch(`${API_BASE}/api/feedback/uninstall`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, comment: comment.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Request failed");
      setState("success");
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="uninstall-feedback">
        <div className="uninstall-feedback-inner">
          <div className="uf-success" role="status">
            <p className="uf-success-title">Thanks for the feedback.</p>
            <p className="uf-success-body">
              We read every response. It helps us make Element Armory better for
              the developers who stay.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="uninstall-feedback">
      <div className="uninstall-feedback-inner">
        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="uf-fieldset">
            <legend className="uf-legend">Why did you uninstall?</legend>
            <ul className="uf-radio-list" role="radiogroup">
              {REASONS.map(({ value, label }) => (
                <li key={value}>
                  <label
                    className={`uf-radio-label${reason === value ? " uf-radio-label--selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      className="uf-radio-input"
                      checked={reason === value}
                      onChange={() => setReason(value)}
                    />
                    <span className="uf-radio-text">{label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <label className="uf-textarea-label">
            Anything else? (optional)
            <textarea
              className="uf-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              placeholder="Tell us more..."
              rows={4}
            />
          </label>

          <button
            type="submit"
            className="uf-submit"
            disabled={!reason || state === "submitting"}
            aria-label="Send feedback"
          >
            {state === "submitting" && (
              <span className="uf-spinner" aria-hidden />
            )}
            Send Feedback
          </button>

          {state === "error" && (
            <p className="uf-error" role="alert">
              Something went wrong. Please try again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
