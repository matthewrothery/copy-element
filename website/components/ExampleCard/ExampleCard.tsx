import type { ReactElement } from "react";
import Link from "next/link";
import type { Example } from "@/data/examples";
import "./ExampleCard.css";

function buildSrcDoc(html: string, css: string): string {
  return `<html><head><style>${css}</style></head><body>${html}</body></html>`;
}

export function ExampleCard({ example }: { example: Example }): ReactElement {
  return (
    <Link href={`/examples/${example.id}`} className="example-card">
      <div className="card-preview">
        <iframe
          className="card-preview-frame"
          srcDoc={buildSrcDoc(example.html, example.css)}
          sandbox=""
          title={`${example.name} preview`}
          tabIndex={-1}
          aria-hidden
        />
        <div className="card-preview-overlay" />
      </div>
      <div className="card-footer">
        <span className="card-name">{example.name}</span>
        <span className="card-category">{example.category}</span>
      </div>
    </Link>
  );
}
