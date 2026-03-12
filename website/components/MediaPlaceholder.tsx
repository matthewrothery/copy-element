import { ImageIcon } from "lucide-react";

type MediaPlaceholderProps = {
  aspectRatio?: "video" | "square";
  label?: string;
};

export function MediaPlaceholder({
  aspectRatio = "video",
  label = "Placeholder",
}: MediaPlaceholderProps): React.ReactElement {
  return (
    <div
      className={`media-placeholder ${aspectRatio === "square" ? "square" : ""}`}
      aria-hidden
    >
      <span className="media-placeholder-content">
        <ImageIcon size={32} aria-hidden />
        {label}
      </span>
    </div>
  );
}
