"use client";

import { useEffect, useRef, useState } from "react";
import "./SupportForm.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const TOPICS = [
  "Bug report",
  "Billing question",
  "Feature request",
  "Account issue",
  "Other",
] as const;

type FormState = "idle" | "submitting" | "success" | "error";

export function SupportForm(): React.ReactElement {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const loadedAtRef = useRef<number>(0);
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    loadedAtRef.current = Date.now();
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !topic || !message.trim()) return;

    setState("submitting");
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/support/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), topic, message: message.trim(), _loadedAt: loadedAtRef.current, website: honeypot }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setErrorMessage(body.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setState("success");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="support-form">
        <div className="support-form-inner">
          <div className="sf-success" role="status">
            <p className="sf-success-title">Message sent.</p>
            <p className="sf-success-body">
              We&apos;ll get back to you at {email}. You can also reach us directly at{" "}
              <a href="mailto:support@elementarmory.com">support@elementarmory.com</a>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isDisabled = !name.trim() || !email.trim() || !topic || !message.trim() || state === "submitting";

  return (
    <div className="support-form">
      <div className="support-form-inner">
        <form onSubmit={handleSubmit} noValidate>
          <div className="sf-field">
            <label className="sf-label" htmlFor="sf-name">Name</label>
            <input
              id="sf-name"
              type="text"
              className="sf-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </div>

          <div className="sf-field">
            <label className="sf-label" htmlFor="sf-email">Email</label>
            <input
              id="sf-email"
              type="email"
              className="sf-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="sf-field">
            <label className="sf-label" htmlFor="sf-topic">Topic</label>
            <select
              id="sf-topic"
              className={`sf-select${topic ? "" : " sf-select--placeholder"}`}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            >
              <option value="" disabled>Select a topic</option>
              {TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="sf-field">
            <label className="sf-label" htmlFor="sf-message">Message</label>
            <textarea
              id="sf-message"
              className="sf-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              placeholder="Describe your issue or question in detail..."
              rows={6}
              required
            />
            <span className="sf-char-count" aria-live="polite">
              {message.length}/2000
            </span>
          </div>

          {/* Honeypot — hidden from humans, bots fill it in */}
          <div className="sf-honeypot" aria-hidden="true">
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className="sf-submit"
            disabled={isDisabled}
            aria-label="Send message"
          >
            {state === "submitting" && (
              <span className="sf-spinner" aria-hidden />
            )}
            Send Message
          </button>

          {state === "error" && (
            <p className="sf-error" role="alert">{errorMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
}
