"use client";

import { useEffect, useRef } from "react";
import type { PipelineDiagramProps } from "./types";
import "./PipelineDiagram.css";

function PipelineConnector({ index }: { index: number }) {
  const nodeDelay = index * 200;
  const lineDelay = nodeDelay + 100;

  return (
    <div className="pipeline-connector" aria-hidden="true">
      <svg
        className="pipeline-connector-svg"
        width="2"
        height="48"
        viewBox="0 0 2 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base faint line */}
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="48"
          stroke="var(--pipeline-line-base)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Animated accent line */}
        <line
          className="pipeline-connector-line"
          x1="1"
          y1="0"
          x2="1"
          y2="48"
          stroke="var(--pipeline-line-active)"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1 1"
          strokeDashoffset="1"
          style={{ "--pipeline-line-delay": `${lineDelay}ms` } as React.CSSProperties}
        />
        {/* Travelling dot */}
        <circle
          className="pipeline-connector-dot"
          cx="1"
          cy="4"
          r="3"
          fill="var(--pipeline-line-active)"
          style={{ "--pipeline-dot-delay": `${lineDelay + 50}ms` } as React.CSSProperties}
        />
      </svg>
    </div>
  );
}

export function PipelineDiagram({ nodes, className }: PipelineDiagramProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el == null) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={["pipeline-diagram", className].filter(Boolean).join(" ")}
    >
      {nodes.map((node, i) => (
        <div key={node.id} className="pipeline-item">
          <div
            className={["pipeline-node", node.highlight === true ? "pipeline-node--highlight" : ""].filter(Boolean).join(" ")}
            style={{ "--pipeline-node-delay": `${i * 200}ms` } as React.CSSProperties}
          >
            {node.icon != null && (
              <div className="pipeline-node-icon" aria-hidden="true">
                {node.icon}
              </div>
            )}
            <div className="pipeline-node-body">
              <div className="pipeline-node-title">{node.title}</div>
              <div className="pipeline-node-subtitle">{node.subtitle}</div>
              {node.tags != null && node.tags.length > 0 && (
                <div className="pipeline-node-tags">
                  {node.tags.map((tag) => (
                    <span key={tag} className="pipeline-node-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {node.microcopy != null && node.microcopy !== "" && (
                <div className="pipeline-node-microcopy">{node.microcopy}</div>
              )}
            </div>
          </div>
          {i < nodes.length - 1 && <PipelineConnector index={i} />}
        </div>
      ))}
    </div>
  );
}
