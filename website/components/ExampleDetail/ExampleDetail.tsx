"use client";

import { useState, useRef } from "react";
import type { Example } from "@/data/examples";
import { ExampleCodeEditor } from "./ExampleCodeEditor";
import { ExamplePreview } from "./ExamplePreview";
import { ExampleActionBar } from "./ExampleActionBar";
import "./ExampleDetail.css";

function buildSrcDoc(html: string, css: string): string {
  return `<html><head><style>${css}</style></head><body>${html}</body></html>`;
}

export function ExampleDetail({
  example,
}: {
  example: Example;
}): React.ReactElement {
  const [html, setHtml] = useState(example.html);
  const [css, setCss] = useState(example.css);
  const [srcDoc, setSrcDoc] = useState(() =>
    buildSrcDoc(example.html, example.css)
  );
  const [toast, setToast] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleUpdate(nextHtml: string, nextCss: string): void {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSrcDoc(buildSrcDoc(nextHtml, nextCss));
    }, 150);
  }

  function handleHtmlChange(val: string): void {
    setHtml(val);
    scheduleUpdate(val, css);
  }

  function handleCssChange(val: string): void {
    setCss(val);
    scheduleUpdate(html, val);
  }

  function showToast(msg: string): void {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="example-detail">
      <ExampleActionBar
        html={html}
        css={css}
        exampleName={example.name}
        exampleDescription={example.description}
        onToast={showToast}
      />
      <div className="detail-body">
        <ExampleCodeEditor
          html={html}
          css={css}
          onHtmlChange={handleHtmlChange}
          onCssChange={handleCssChange}
        />
        <ExamplePreview srcDoc={srcDoc} />
      </div>
      {toast !== null && (
        <div className="detail-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
