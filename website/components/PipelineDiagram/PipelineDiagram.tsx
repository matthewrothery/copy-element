"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { PipelineBranchCard } from "./PipelineBranchCard";
import { PipelineCaptureCard } from "./PipelineCaptureCard";
import { PipelineHubCard } from "./PipelineHubCard";
import { buildPathD, rectCenterLeft, rectCenterRight } from "./geometry";
import type { PipelineBranch, PipelineDiagramProps, PipelineStepStatus } from "./types";
import "./PipelineDiagram.css";

const FINAL_PHASE = 6;
/** Pause after the last phase before animating again. */
const LOOP_PAUSE_MS = 3000;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (): void => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function hubStatus(phase: number): "pending" | "running" | "success" {
  if (phase < 2) return "pending";
  if (phase === 2) return "running";
  return "success";
}

function branchStepStatus(
  branch: PipelineBranch,
  stepIndex: number,
  phase: number
): PipelineStepStatus {
  if (branch.skipped === true) {
    if (phase < 4) return "pending";
    return "skipped";
  }
  if (stepIndex === 0) {
    if (phase < 4) return "pending";
    if (phase === 4) return "running";
    return "success";
  }
  if (phase < 4) return "pending";
  if (phase === 4) return "pending";
  if (phase === 5) return "running";
  return "success";
}

export function PipelineDiagram({ graph, className }: PipelineDiagramProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const branchRefs = useRef<(HTMLDivElement | null)[][]>(
    graph.branches.map((b) => new Array(b.steps.length).fill(null))
  );

  const setBranchRef = useCallback((branchIndex: number, stepIndex: number) => {
    return (el: HTMLDivElement | null): void => {
      const row = branchRefs.current[branchIndex];
      if (row != null) {
        row[stepIndex] = el;
      }
    };
  }, []);

  const [phase, setPhase] = useState(0);
  const [paths, setPaths] = useState<{ d: string; variant: "active" | "muted" }[]>([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  const [loopKey, setLoopKey] = useState(0);

  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (el == null) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (reducedMotion) {
      setPhase(FINAL_PHASE);
      return;
    }

    const timers: number[] = [];
    const schedule: { phase: number; delay: number }[] = [
      { phase: 1, delay: 0 },
      { phase: 2, delay: 160 },
      { phase: 3, delay: 980 },
      { phase: 4, delay: 420 },
      { phase: 5, delay: 320 },
      { phase: 6, delay: 920 },
    ];
    let acc = 0;
    schedule.forEach(({ phase: nextPhase, delay }) => {
      acc += delay;
      timers.push(
        window.setTimeout(() => {
          setPhase(nextPhase);
        }, acc)
      );
    });

    const totalMs = acc;
    const loopTimer = window.setTimeout(() => {
      setPhase(0);
      setLoopKey((k) => k + 1);
    }, totalMs + LOOP_PAUSE_MS);
    timers.push(loopTimer);

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [visible, reducedMotion, loopKey]);

  const measurePaths = useCallback((): void => {
    const container = containerRef.current;
    const captureEl = captureRef.current;
    const hub = hubRef.current;
    if (container == null || captureEl == null || hub == null) return;

    const cRect = container.getBoundingClientRect();
    const next: { d: string; variant: "active" | "muted" }[] = [];
    const forkGap = 56;

    const capR = captureEl.getBoundingClientRect();
    const hR = hub.getBoundingClientRect();
    const p0 = rectCenterRight(capR, cRect);
    const p1 = rectCenterLeft(hR, cRect);

    if (phase >= 1) {
      next.push({ d: buildPathD([p0, p1]), variant: "active" });
    }

    const hubRight = rectCenterRight(hR, cRect);
    const forkX = hubRight.x + forkGap;
    const hubY = hubRight.y;

    if (phase >= 4) {
      next.push({
        d: buildPathD([hubRight, { x: forkX, y: hubY }]),
        variant: "active",
      });
    }

    graph.branches.forEach((branch, bi) => {
      const firstEl = branchRefs.current[bi]?.[0];
      if (firstEl == null) return;
      const b0 = firstEl.getBoundingClientRect();
      const target = rectCenterLeft(b0, cRect);
      const muted = branch.skipped === true;
      const variant = muted ? "muted" : "active";

      if (phase >= 4) {
        const elbow = [
          { x: forkX, y: hubY },
          { x: forkX, y: target.y },
          target,
        ];
        next.push({ d: buildPathD(elbow), variant });
      }

      if (branch.steps.length > 1 && branch.skipped !== true) {
        const secondEl = branchRefs.current[bi]?.[1];
        if (secondEl != null) {
          const sR = secondEl.getBoundingClientRect();
          const from = rectCenterRight(b0, cRect);
          const to = rectCenterLeft(sR, cRect);
          if (phase >= 5) {
            next.push({ d: buildPathD([from, to]), variant: "active" });
          }
        }
      }
    });

    setPaths(next);
    setSvgSize({ w: cRect.width, h: cRect.height });
  }, [graph.branches, phase]);

  useLayoutEffect(() => {
    measurePaths();
  }, [measurePaths, phase, visible]);

  useEffect(() => {
    const container = containerRef.current;
    if (container == null) return;

    const ro = new ResizeObserver(() => {
      measurePaths();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [measurePaths]);

  const hStatus = hubStatus(phase);
  const showCapture = phase >= 1;
  const showHub = phase >= 2;
  const showBranches = phase >= 4;

  const summaryId = "pipeline-diagram-summary";

  return (
    <div
      ref={containerRef}
      className={["pipeline-diagram", visible ? "is-visible" : "", className].filter(Boolean).join(" ")}
      role="img"
      aria-labelledby={summaryId}
    >
      <p id={summaryId} className="pipeline-diagram-sr-only">
        Capture flow: capture from any site, extract components, then parallel paths including export,
        MCP and AI, and one optional path shown as skipped.
      </p>

      <div className="pipeline-diagram-surface" aria-hidden="true" />

      <div className="pipeline-diagram-layout">
        <div className="pipeline-diagram-col pipeline-diagram-col--capture">
          <div ref={captureRef} className="pipeline-diagram-anchor">
            <PipelineCaptureCard config={graph.capture} visible={showCapture} />
          </div>
        </div>

        <div className="pipeline-diagram-col pipeline-diagram-col--hub">
          <div ref={hubRef} className="pipeline-diagram-anchor">
            <PipelineHubCard config={graph.hub} status={hStatus} visible={showHub} />
          </div>
        </div>

        <div className="pipeline-diagram-col pipeline-diagram-col--branches">
          {graph.branches.map((branch, bi) => (
            <div key={branch.id} className="pipeline-branch-row">
              {branch.steps.map((step, si) => (
                <div
                  key={step.id}
                  ref={setBranchRef(bi, si)}
                  className="pipeline-diagram-anchor"
                >
                  <PipelineBranchCard
                    step={step}
                    status={branchStepStatus(branch, si, phase)}
                    visible={showBranches}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {svgSize.w > 0 && svgSize.h > 0 && (
        <svg
          className="pipeline-diagram-svg"
          width={svgSize.w}
          height={svgSize.h}
          viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
          aria-hidden="true"
        >
          {paths.map((seg, i) => (
            <path
              key={`${loopKey}-${seg.d}-${i}`}
              className={[
                "pipeline-edge",
                seg.variant === "muted" ? "pipeline-edge--muted" : "pipeline-edge--active",
                visible ? "is-drawn" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              d={seg.d}
              fill="none"
              pathLength={100}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
