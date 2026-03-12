"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Carousel } from "./Carousel";
import "@/styles/feature-carousel.css";

export type FeatureCarouselImageItem = {
  type: "image";
  title: string;
  description: string;
  src: string;
  alt?: string;
};

export type FeatureCarouselVideoItem = {
  type: "video";
  title: string;
  description: string;
  posterSrc: string;
  videoSrc: string;
  alt?: string;
};

export type FeatureCarouselItem = FeatureCarouselImageItem | FeatureCarouselVideoItem;

export type FeatureCarouselProps = {
  title: string;
  description: string;
  items: FeatureCarouselItem[];
  headingAlign?: "center" | "left";
};

function CarouselCard({
  item,
  isPlaying,
  onPlayPause,
}: {
  item: FeatureCarouselItem;
  isPlaying: boolean;
  onPlayPause: () => void;
}): React.ReactElement {
  if (item.type === "image") {
    return (
      <figure className="feature-carousel-card">
        <div className="feature-carousel-media">
          <img
            src={item.src}
            alt={item.alt ?? item.title}
            loading="lazy"
          />
        </div>
        <figcaption className="feature-carousel-caption">
          <h4 className="feature-carousel-caption-title">{item.title}</h4>
          <p className="feature-carousel-caption-desc">{item.description}</p>
        </figcaption>
      </figure>
    );
  }

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) el.play().catch(() => {});
    else el.pause();
  }, [isPlaying]);

  return (
    <figure className="feature-carousel-card">
      <div className="feature-carousel-media">
        <video
          ref={videoRef}
          src={item.videoSrc}
          poster={item.posterSrc}
          preload="metadata"
          playsInline
          muted={false}
        />
        <button
          type="button"
          className="feature-carousel-play-wrap"
          onClick={onPlayPause}
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
        </button>
      </div>
      <figcaption className="feature-carousel-caption">
        <h4 className="feature-carousel-caption-title">{item.title}</h4>
        <p className="feature-carousel-caption-desc">{item.description}</p>
      </figcaption>
    </figure>
  );
}

export function FeatureCarousel({
  title,
  description,
  items,
  headingAlign = "center",
}: FeatureCarouselProps): React.ReactElement {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlayPause = (item: FeatureCarouselVideoItem, index: number) => {
    const id = `${index}-${item.videoSrc}`;
    setPlayingId((prev) => (prev === id ? null : id));
  };

  return (
    <Carousel
      className="feature-carousel"
      heading={title}
      description={description}
      headingAlign={headingAlign}
    >
      {items.map((item, index) => (
        <CarouselCard
          key={`${item.type}-${index}-${item.title}`}
          item={item}
          isPlaying={
            item.type === "video" &&
            playingId === `${index}-${item.videoSrc}`
          }
          onPlayPause={() =>
            item.type === "video" && handlePlayPause(item, index)
          }
        />
      ))}
    </Carousel>
  );
}
