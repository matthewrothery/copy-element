export function isCapturableUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  const unsupportedPrefixes = ["chrome://", "chrome-extension://", "edge://", "about:"];
  if (unsupportedPrefixes.some((prefix) => url.startsWith(prefix))) {
    return false;
  }

  if (url.startsWith("https://chrome.google.com")) {
    return false;
  }

  return true;
}

export function getUnsupportedPageMessage(url: string | undefined): string {
  if (!url) {
    return "Capture isn't supported on this page.";
  }
  if (url.startsWith("https://chrome.google.com")) {
    return "Capture isn't supported on the Chrome Web Store.";
  }
  if (
    url.startsWith("edge://") ||
    url.startsWith("about:")
  ) {
    return "Capture doesn't work on browser pages.";
  } else if (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://")
  ) {
    return "Capture isn't supported on extension pages.";
  }
  return "Capture isn't supported on this page.";
}
