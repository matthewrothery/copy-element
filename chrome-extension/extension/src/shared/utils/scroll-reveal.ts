/**
 * Scrolls captured elements into view to trigger scroll-activated animations
 * (IntersectionObserver-driven) and lazy-loaded images before capture.
 */

const ELEMENT_SETTLE_MS = 300;
const PAGE_SCROLL_STEP_DIVISOR = 5;
const PAGE_SCROLL_DELAY_MS = 100;
const PAGE_SCROLL_MAX_PASSES = 3;

function isElementInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

function hasLazyContent(element: Element): boolean {
  for (const img of Array.from(element.querySelectorAll("img"))) {
    if (img.getAttribute("loading") === "lazy" || img.hasAttribute("data-src")) {
      return true;
    }
  }
  return false;
}

function waitFrames(count: number): Promise<void> {
  return new Promise<void>((resolve) => {
    let remaining = count;
    function tick(): void {
      remaining--;
      if (remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  });
}

/**
 * Scrolls the element into view (if needed) and scrolls through its full
 * height if it overflows the viewport. This ensures IntersectionObserver
 * callbacks fire for all child elements before freeze+clone.
 *
 * Cases handled:
 * - Element fits in viewport and is already visible → no-op (fast path)
 * - Element is off-screen → scroll to top of element
 * - Element overflows the viewport → scroll from its top to its bottom in
 *   increments, then return to its top for capture
 *
 * Returns true if any scroll was performed.
 */
export async function scrollToRevealElement(element: Element): Promise<boolean> {
  const rect = element.getBoundingClientRect();
  const overflowsViewport = rect.height > window.innerHeight;
  const alreadyVisible = isElementInViewport(element);
  const needsLazyWait = hasLazyContent(element);

  // Fast path: element fits and is fully visible with no lazy content
  if (alreadyVisible && !overflowsViewport && !needsLazyWait) {
    return false;
  }

  // Scroll the top of the element into view
  element.scrollIntoView({ behavior: "instant", block: "start" });
  await waitFrames(2);

  if (overflowsViewport) {
    // Scroll through the element's full height to trigger IntersectionObservers
    // on all child elements that may be below the initial viewport position.
    const step = Math.max(window.innerHeight / 2, 100);
    const elementTop = window.scrollY + element.getBoundingClientRect().top;
    const elementBottom = elementTop + rect.height;

    let y = elementTop + step;
    while (y < elementBottom) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise<void>((resolve) => setTimeout(resolve, PAGE_SCROLL_DELAY_MS));
      y += step;
    }

    // Return to element top so the capture starts from the top of the element
    window.scrollTo({ top: elementTop, behavior: "instant" });
    await waitFrames(2);
  }

  // Wait for scroll-triggered animations and lazy images to initialize
  await new Promise<void>((resolve) => setTimeout(resolve, ELEMENT_SETTLE_MS));

  return true;
}

/**
 * Scrolls through the full page in increments to trigger lazy-loaded images
 * and scroll-activated content. Performs up to 3 passes and stops early if
 * no new content loaded. Restores the original scroll position after.
 *
 * Used for full-page captures before calling performCapture.
 */
export async function scrollPageToTriggerContent(): Promise<void> {
  const originalScrollY = window.scrollY;
  const step = Math.max(window.innerHeight / PAGE_SCROLL_STEP_DIVISOR, 100);
  let prevScrollHeight = document.documentElement.scrollHeight;

  for (let pass = 0; pass < PAGE_SCROLL_MAX_PASSES; pass++) {
    let y = 0;
    while (y < document.documentElement.scrollHeight) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise<void>((resolve) => setTimeout(resolve, PAGE_SCROLL_DELAY_MS));
      y += step;
    }
    const newScrollHeight = document.documentElement.scrollHeight;
    if (newScrollHeight === prevScrollHeight) {
      break;
    }
    prevScrollHeight = newScrollHeight;
  }

  window.scrollTo({ top: originalScrollY, behavior: "instant" });
  await waitFrames(2);
}
