"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { convertHtmlFull, type Framework } from "@/lib/htmlToReact";
import "./HtmlToReactConverter.css";

const CHROME_STORE_URL = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#";

const FRAMEWORKS: { id: Framework; label: string }[] = [
  { id: "react", label: "React" },
  { id: "vue", label: "Vue" },
  { id: "nextjs", label: "Next.js" },
];

const PLACEHOLDER_INPUT = `<div class="card" style="padding: 16px; border-radius: 8px;">
  <img src="avatar.png" width="48" height="48">
  <h2 class="card-title" for="name">Hello World</h2>
  <p class="card-body">Paste your HTML here and click Convert.</p>
  <button onclick="handleClick()">Get Started</button>
</div>`;

export function HtmlToReactConverter(): ReactElement {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [framework, setFramework] = useState<Framework>("react");
  const [convertToTailwind, setConvertToTailwind] = useState(false);
  const [addA11y, setAddA11y] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function handleConvert(): void {
    if (!input.trim()) return;
    const result = convertHtmlFull(input, { framework, convertToTailwind, addA11y });
    setOutput(result);
  }

  function handleCopy(): void {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      showToast("Copied!");
    }).catch(() => {
      showToast("Copy failed");
    });
  }

  function showToast(msg: string): void {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="html-converter">
      {/* Options bar */}
      <div className="converter-options">
        <div
          className="converter-framework"
          role="group"
          aria-label="Target framework"
        >
          {FRAMEWORKS.map((fw) => (
            <button
              key={fw.id}
              type="button"
              className="converter-framework-btn"
              aria-pressed={framework === fw.id}
              onClick={() => setFramework(fw.id)}
            >
              {fw.label}
            </button>
          ))}
        </div>

        <div className="converter-toggles">
          <label className="converter-toggle">
            <input
              type="checkbox"
              checked={convertToTailwind}
              onChange={(e) => setConvertToTailwind(e.target.checked)}
            />
            CSS → Tailwind
          </label>
          <label className="converter-toggle">
            <input
              type="checkbox"
              checked={addA11y}
              onChange={(e) => setAddA11y(e.target.checked)}
            />
            Accessibility fixes
          </label>
        </div>

        <div className="converter-spacer" />

        <button
          type="button"
          className="converter-convert-btn"
          onClick={handleConvert}
          disabled={!input.trim()}
        >
          Convert →
        </button>
      </div>

      {/* Split panes */}
      <div className="converter-panes">
        <div className="converter-pane converter-pane--input">
          <div className="converter-pane-header">
            <span className="converter-pane-label">HTML Input</span>
          </div>
          <textarea
            className="converter-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER_INPUT}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="HTML input"
          />
        </div>

        <div className="converter-pane">
          <div className="converter-pane-header">
            <span className="converter-pane-label">Output</span>
            <button
              type="button"
              className="converter-copy-btn"
              onClick={handleCopy}
              disabled={!output}
              aria-label="Copy output to clipboard"
            >
              Copy
            </button>
          </div>
          <textarea
            className="converter-textarea"
            value={output}
            readOnly
            placeholder="Converted code will appear here…"
            spellCheck={false}
            aria-label="Converted output"
            aria-live="polite"
          />
        </div>
      </div>

      {/* Upsell strip */}
      <div className="converter-upsell">
        <p className="converter-upsell-text">
          Tired of copy-pasting HTML? Capture UI directly from any live site.
        </p>
        <a
          href={CHROME_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="converter-upsell-link"
        >
          Try Element Armory – It's Free →
        </a>
      </div>

      {toast !== null && (
        <div className="converter-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
