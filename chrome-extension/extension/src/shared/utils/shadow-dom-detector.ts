/**
 * Detects if an element or its subtree involves Shadow DOM.
 * Used to warn users that captured output may not fully match the original.
 */
export function hasShadowDomInSubtree(element: HTMLElement): boolean {
  if (element.getRootNode() instanceof ShadowRoot) {
    return true;
  }

  const el = element as Element & { shadowRoot?: ShadowRoot };
  if (el.shadowRoot) {
    return true;
  }

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node: Node): number {
        const el = node as Element & { shadowRoot?: ShadowRoot };
        if (el.shadowRoot) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  return walker.nextNode() !== null;
}
