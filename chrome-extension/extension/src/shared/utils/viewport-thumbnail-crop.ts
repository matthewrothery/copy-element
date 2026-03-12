const DEFAULT_MAX_WIDTH = 480;
const DEFAULT_MAX_HEIGHT = 360;
const JPEG_QUALITY = 0.85;
const THUMBNAIL_BG = "#f8fafc";

export interface ElementRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Crops the viewport screenshot to the element rect and scales to thumbnail size.
 * Assumes dataUrl is a full viewport capture; viewportWidth/Height are the
 * viewport dimensions in CSS pixels when the capture was taken.
 */
export function cropViewportToThumbnail(
  dataUrl: string,
  elementRect: ElementRect,
  viewportWidth: number,
  viewportHeight: number,
  maxWidth = DEFAULT_MAX_WIDTH,
  maxHeight = DEFAULT_MAX_HEIGHT
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Failed to load viewport image for thumbnail crop."));
    img.onload = () => {
      try {
        const scaleX = img.naturalWidth / viewportWidth;
        const scaleY = img.naturalHeight / viewportHeight;
        const srcX = Math.max(0, Math.round(elementRect.left * scaleX));
        const srcY = Math.max(0, Math.round(elementRect.top * scaleY));
        const srcW = Math.max(1, Math.min(
          Math.round(elementRect.width * scaleX),
          img.naturalWidth - srcX
        ));
        const srcH = Math.max(1, Math.min(
          Math.round(elementRect.height * scaleY),
          img.naturalHeight - srcY
        ));

        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = srcW;
        cropCanvas.height = srcH;
        const cropCtx = cropCanvas.getContext("2d");
        if (!cropCtx) {
          reject(new Error("Could not create canvas context for thumbnail crop."));
          return;
        }
        cropCtx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

        const thumbScale = Math.min(maxWidth / cropCanvas.width, maxHeight / cropCanvas.height);
        const drawWidth = Math.max(1, Math.round(cropCanvas.width * thumbScale));
        const drawHeight = Math.max(1, Math.round(cropCanvas.height * thumbScale));
        const targetCanvas = document.createElement("canvas");
        targetCanvas.width = maxWidth;
        targetCanvas.height = maxHeight;
        const ctx = targetCanvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not create canvas context for thumbnail output."));
          return;
        }
        ctx.fillStyle = THUMBNAIL_BG;
        ctx.fillRect(0, 0, maxWidth, maxHeight);
        const x = Math.round((maxWidth - drawWidth) / 2);
        const y = Math.round((maxHeight - drawHeight) / 2);
        ctx.drawImage(cropCanvas, 0, 0, srcW, srcH, x, y, drawWidth, drawHeight);

        resolve(targetCanvas.toDataURL("image/jpeg", JPEG_QUALITY));
      } catch (err) {
        reject(err);
      }
    };
    img.src = dataUrl;
  });
}
