import type { ReactElement } from "react";
import { ChromeStoreCtaLabel } from "@/components/ChromeStoreCtaLabel";
import { CHROME_STORE_URL } from "@/lib/publicConfig";

type Props = {
  html: string;
  css: string;
  exampleName: string;
  exampleDescription: string;
  onToast: (msg: string) => void;
};

function buildPrompt(
  name: string,
  description: string,
  html: string,
  css: string
): string {
  return `Recreate this UI element as a React functional component using TypeScript.

Element: ${name}
${description}

HTML:
${html}

CSS:
${css}`;
}

export function ExampleActionBar({
  html,
  css,
  exampleName,
  exampleDescription,
  onToast,
}: Props): ReactElement {
  async function copyHtml(): Promise<void> {
    await navigator.clipboard.writeText(html);
    onToast("HTML copied");
  }

  async function copyCss(): Promise<void> {
    await navigator.clipboard.writeText(css);
    onToast("CSS copied");
  }

  async function copyPrompt(): Promise<void> {
    await navigator.clipboard.writeText(
      buildPrompt(exampleName, exampleDescription, html, css)
    );
    onToast("Prompt copied");
  }

  return (
    <div className="action-bar">
      <div className="action-bar-buttons">
        <button className="action-btn" onClick={copyHtml}>
          Copy HTML
        </button>
        <button className="action-btn" onClick={copyCss}>
          Copy CSS
        </button>
        <button className="action-btn" onClick={copyPrompt}>
          Copy Prompt
        </button>
      </div>
      <div className="action-bar-spacer" />
      <div className="action-bar-install">
        <span className="action-bar-hint">Capture your own elements →</span>
        <a
          className="action-btn"
          href={CHROME_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ChromeStoreCtaLabel />
        </a>
      </div>
    </div>
  );
}
