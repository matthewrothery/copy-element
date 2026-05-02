"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getApiUrl, apiFetch } from "@/lib/api";
import "./SignInForm.css";

const CALLBACK_PATH = "/account";

function getCallbackUrl(): string {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const installId = params.get("install_id");
    const extensionId = params.get("extension_id");
    if (installId && extensionId) {
      return (
        window.location.origin +
        "/auth/extension-callback" +
        "?install_id=" + encodeURIComponent(installId) +
        "&extension_id=" + encodeURIComponent(extensionId)
      );
    }
    const returnTo = params.get("return_to");
    if (returnTo && returnTo.startsWith("/")) {
      return window.location.origin + returnTo;
    }
    return window.location.origin + CALLBACK_PATH;
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return base ? base.replace(/\/$/, "") + CALLBACK_PATH : CALLBACK_PATH;
}

/** Google "G" logo – official dark theme asset per branding guidelines (viewBox 0 0 48 48) */
function GoogleGIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      aria-hidden
      width="20"
      height="20"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function SignInForm(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [callbackURL, setCallbackURL] = useState(getCallbackUrl);

  useEffect(() => {
    const url = getCallbackUrl();
    setCallbackURL(url);
    // Redirect already-signed-in users away from the sign-in page
    void apiFetch("/api/me", { credentials: "include" })
      .then((res) => res.json() as Promise<{ user?: { id?: string } | null }>)
      .then((data) => {
        if (data?.user?.id) {
          window.location.replace(url);
        }
      })
      .catch(() => {});
  }, []);

  async function handleGoogleSignIn(): Promise<void> {
    setMessage(null);
    setGoogleSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/sign-in/social", {
        method: "POST",
        body: JSON.stringify({ provider: "google", callbackURL }),
      });
      const redirectLocation = res.headers.get("location");
      if (redirectLocation) {
        window.location.assign(redirectLocation);
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { url?: string; redirectTo?: string };
      const redirectUrl = data.url ?? data.redirectTo;
      if (typeof redirectUrl === "string" && redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      setMessage({ type: "error", text: "Unable to start Google sign-in." });
    } catch {
      setMessage({ type: "error", text: "Network error. Try again." });
    } finally {
      setGoogleSubmitting(false);
    }
  }

  async function handleMagicSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/sign-in/magic-link", {
        method: "POST",
        body: JSON.stringify({ email: trimmed, callbackURL }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.message ?? data.error ?? "Failed to send magic link.",
        });
        return;
      }
      setMessage({ type: "success", text: "Check your email for the sign-in link." });
    } catch {
      setMessage({ type: "error", text: "Network error. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sign-in-form" data-sign-in-card>
      <div className="sign-in-form-header">
        <div className="sign-in-form-logo-block">
          <Link
            href="/"
            className="sign-in-form-logo"
            aria-label="Element Armory home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={56}
              height={56}
              className="sign-in-form-logo-icon"
              aria-hidden
            />
          </Link>
        </div>
        <div className="sign-in-form-titles">
          <h1 className="sign-in-form-title">Sign in to Element Armory</h1>
          <p className="sign-in-form-subtitle">
            Use Google or a magic link sent to your email.
          </p>
        </div>
      </div>

      <div className="sign-in-form-body">
        <div className="sign-in-form-form-block">
          <button
            type="button"
            className="sign-in-form-google"
            aria-label="Sign in with Google"
            onClick={handleGoogleSignIn}
            disabled={googleSubmitting || submitting}
          >
            <span className="sign-in-form-google-content">
              <span className="sign-in-form-google-icon-wrap">
                <GoogleGIcon className="sign-in-form-google-icon" />
              </span>
              <span className="sign-in-form-google-text">Sign in with Google</span>
            </span>
          </button>

          <p className="sign-in-form-divider">Or continue with email</p>

          <form onSubmit={handleMagicSubmit} className="sign-in-form-fields" noValidate>
            <input
              type="email"
              name="email"
              placeholder="Email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              className="sign-in-form-input"
              autoComplete="email"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={submitting}
              className="sign-in-form-submit"
              aria-label="Send magic link"
            >
              {submitting ? "Sending…" : "Continue"}
            </button>
          </form>

          {message && (
            <p
              className={`sign-in-form-message ${message.type}`}
              role="alert"
              aria-live="polite"
            >
              {message.text}
            </p>
          )}

          <p className="sign-in-form-legal">
            By continuing, you agree to the{" "}
            <Link href="/terms" className="sign-in-form-legal-link">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="sign-in-form-legal-link">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <p className="sign-in-form-support">
          Having issues?{" "}
          <Link href="/contact" className="sign-in-form-support-link">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
