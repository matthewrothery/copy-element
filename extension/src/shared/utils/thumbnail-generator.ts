import html2canvas from "html2canvas";

export async function generateThumbnail(element: HTMLElement, maxWidth = 200, maxHeight = 120): Promise<string> {
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 1,
    useCORS: true,
    logging: false
  });

  const targetCanvas = document.createElement("canvas");
  targetCanvas.width = maxWidth;
  targetCanvas.height = maxHeight;
  const ctx = targetCanvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context for thumbnail generation.");
  }

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, maxWidth, maxHeight);

  const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  const drawWidth = Math.max(1, Math.round(canvas.width * scale));
  const drawHeight = Math.max(1, Math.round(canvas.height * scale));
  const x = Math.round((maxWidth - drawWidth) / 2);
  const y = Math.round((maxHeight - drawHeight) / 2);
  ctx.drawImage(canvas, x, y, drawWidth, drawHeight);

  return targetCanvas.toDataURL("image/png");
}
