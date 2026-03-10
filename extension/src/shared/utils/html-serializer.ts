export function serializeElementToHtml(element: HTMLElement): string {
  const container = document.createElement("div");
  container.appendChild(element.cloneNode(true));
  return container.innerHTML;
}
