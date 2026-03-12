"use client";

import { useId, useRef, useEffect } from "react";

const DRAG_THRESHOLD_PX = 5;

export type CarouselProps = {
  heading?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headingAlign?: "center" | "left";
  "aria-labelledby"?: string;
};

export function Carousel({
  heading,
  description,
  children,
  className = "",
  headingAlign = "center",
  "aria-labelledby": ariaLabelledBy,
}: CarouselProps): React.ReactElement {
  const generatedId = useId();
  const titleId = ariaLabelledBy ?? (heading ? generatedId : undefined);
  const rowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    activePointerId: number | null;
    startX: number;
    startScrollLeft: number;
    isDragging: boolean;
    justDragged: boolean;
  }>({
    activePointerId: null,
    startX: 0,
    startScrollLeft: 0,
    isDragging: false,
    justDragged: false,
  });

  useEffect(() => {
    const onPointerMove = (e: PointerEvent): void => {
      const ref = dragRef.current;
      const row = rowRef.current;
      if (
        ref.activePointerId === null ||
        e.pointerId !== ref.activePointerId ||
        !row
      )
        return;
      const dx = e.clientX - ref.startX;
      if (!ref.isDragging && Math.abs(dx) > DRAG_THRESHOLD_PX) {
        ref.isDragging = true;
        row.classList.add("is-dragging");
      }
      if (ref.isDragging) {
        e.preventDefault();
        row.scrollLeft = ref.startScrollLeft - dx;
      }
    };

    const onPointerUp = (e: PointerEvent): void => {
      const ref = dragRef.current;
      const row = rowRef.current;
      if (ref.activePointerId === null || e.pointerId !== ref.activePointerId)
        return;
      if (ref.isDragging) {
        e.preventDefault();
        ref.justDragged = true;
      }
      row?.classList.remove("is-dragging");
      ref.activePointerId = null;
      ref.isDragging = false;
    };

    document.addEventListener("pointermove", onPointerMove, { capture: true });
    document.addEventListener("pointerup", onPointerUp, { capture: true });
    document.addEventListener("pointercancel", onPointerUp, { capture: true });
    return () => {
      document.removeEventListener("pointermove", onPointerMove, {
        capture: true,
      });
      document.removeEventListener("pointerup", onPointerUp, { capture: true });
      document.removeEventListener("pointercancel", onPointerUp, {
        capture: true,
      });
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.pointerType !== "mouse") return;
    const row = rowRef.current;
    if (!row) return;
    dragRef.current.activePointerId = e.pointerId;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScrollLeft = row.scrollLeft;
    dragRef.current.isDragging = false;
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (dragRef.current.justDragged) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.justDragged = false;
    }
  };

  const sectionClass = ["section-inner", className].filter(Boolean).join(" ");
  const headClass =
    headingAlign === "left"
      ? "block-head block-head--left"
      : "block-head";

  return (
    <section
      className={sectionClass}
      aria-labelledby={heading ? titleId : undefined}
    >
      {(heading ?? description) && (
        <div className={headClass}>
          {heading && (
            <h2 id={titleId} className="block-head-title">
              {heading}
            </h2>
          )}
          {description && (
            <p className="block-head-subtitle">{description}</p>
          )}
        </div>
      )}
      <div className="carousel-bleed">
        <div
          ref={rowRef}
          className="carousel-row"
          onPointerDown={handlePointerDown}
          onClickCapture={handleClickCapture}
          role="region"
          aria-label="Carousel"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
