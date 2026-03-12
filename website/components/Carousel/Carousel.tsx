"use client";

import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./Carousel.css";

export type CarouselProps = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  snap?: boolean;
  showControls?: boolean;
  showProgress?: boolean;
};

export function Carousel({
  children,
  className,
  ariaLabel = "Carousel",
  snap = false,
  showControls = true,
  showProgress = false,
}: CarouselProps): React.ReactElement {
  const items = useMemo(() => Children.toArray(children), [children]);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);

  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateMetrics = useCallback(() => {
    const track = trackRef.current;

    if (track == null) {
      return;
    }

    const maxScroll = track.scrollWidth - track.clientWidth;

    if (maxScroll <= 0) {
      setIsAtStart(true);
      setIsAtEnd(true);
      setProgress(100);
      return;
    }

    const current = track.scrollLeft;
    setIsAtStart(current <= 1);
    setIsAtEnd(current >= maxScroll - 1);
    setProgress((current / maxScroll) * 100);
  }, []);

  useEffect(() => {
    const track = trackRef.current;

    if (track == null) {
      return undefined;
    }

    const firstItem = track.firstElementChild;
    const lastItem = track.lastElementChild;

    if (firstItem == null || lastItem == null) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === firstItem) {
            setIsAtStart(entry.isIntersecting);
          }

          if (entry.target === lastItem) {
            setIsAtEnd(entry.isIntersecting);
          }
        });
      },
      {
        root: track,
        threshold: 0.95,
      },
    );

    observer.observe(firstItem);
    observer.observe(lastItem);

    return () => {
      observer.disconnect();
    };
  }, [items]);

  useEffect(() => {
    const track = trackRef.current;

    if (track == null) {
      return undefined;
    }

    const syncMetrics = () => {
      window.requestAnimationFrame(updateMetrics);
    };

    syncMetrics();
    track.addEventListener("scroll", updateMetrics, { passive: true });
    window.addEventListener("resize", updateMetrics);

    return () => {
      track.removeEventListener("scroll", updateMetrics);
      window.removeEventListener("resize", updateMetrics);
    };
  }, [updateMetrics, items]);

  const stopDragging = useCallback(() => {
    const track = trackRef.current;
    isDraggingRef.current = false;
    setDragging(false);
    if (track != null) {
      track.style.scrollBehavior = "smooth";
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) {
        return;
      }

      const track = trackRef.current;

      if (track == null) {
        return;
      }

      event.preventDefault();

      const walk = (event.pageX - dragStartXRef.current) * 1.6;
      track.scrollLeft = dragStartScrollLeftRef.current - walk;
    };

    const handleMouseUp = () => {
      stopDragging();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [stopDragging]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current;

    if (track == null) {
      return;
    }

    isDraggingRef.current = true;
    setDragging(true);
    dragStartXRef.current = event.pageX;
    dragStartScrollLeftRef.current = track.scrollLeft;
    track.style.scrollBehavior = "auto";
  };

  const scrollByCard = (direction: "next" | "prev") => {
    const track = trackRef.current;

    if (track == null) {
      return;
    }

    const firstCard = track.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth ?? track.clientWidth * 0.9;
    const gap = Number.parseInt(window.getComputedStyle(track).gap, 10) || 0;
    const amount = cardWidth + gap;

    track.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={`carousel ${snap ? "snap" : ""} ${className ?? ""}`.trim()}
      role="region"
      aria-label={ariaLabel}
    >
      <div
        ref={trackRef}
        className={`carousel-track ${dragging ? "is-dragging" : ""}`.trim()}
        onMouseDown={handleMouseDown}
        onMouseLeave={stopDragging}
      >
        {children}
      </div>
      {showControls && items.length > 1 && (
        <div className="carousel-controls">
          <div className="carousel-navigation">
            <button
              type="button"
              className="carousel-nav-button"
              aria-label="Previous slide"
              onClick={() => scrollByCard("prev")}
              disabled={isAtStart}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.5 4.5L8 12l7.5 7.5" />
              </svg>
            </button>
            <button
              type="button"
              className="carousel-nav-button"
              aria-label="Next slide"
              onClick={() => scrollByCard("next")}
              disabled={isAtEnd}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.5 4.5L16 12l-7.5 7.5" />
              </svg>
            </button>
          </div>
          {showProgress && (
            <div className="carousel-progress" aria-hidden="true">
              <div className="carousel-progress-track">
                <div
                  className="carousel-progress-thumb"
                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
