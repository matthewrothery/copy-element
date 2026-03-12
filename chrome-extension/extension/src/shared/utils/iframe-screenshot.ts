import html2canvas from "html2canvas";

/**
 * Captures the rendered content of a same-origin iframe (e.g. srcDoc) as a PNG blob.
 * Use for "copy screenshot" in the snippet preview modal.
 */
export function captureIframeAsPngBlob(iframe: HTMLIFrameElement): Promise<Blob> {
  const doc = iframe.contentDocument;
  if (!doc || !doc.body) {
    return Promise.reject(new Error("Iframe document not ready"));
  }

  return html2canvas(doc.body, {
    useCORS: true,
    scale: 2,
    logging: false
  }).then(
    (canvas) =>
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
          "image/png",
          1
        );
      })
  );
}
