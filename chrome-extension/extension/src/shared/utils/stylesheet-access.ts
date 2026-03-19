const stylesheetTextCache = new Map<string, Promise<string | null>>();

interface AccessibleCssRules {
  rules: CSSRuleList;
  cleanup?: () => void;
}

async function fetchStylesheetText(url: string): Promise<string | null> {
  const cached = stylesheetTextCache.get(url);
  if (cached) {
    return cached;
  }

  // Route through the background service worker, which has <all_urls> host
  // permissions and can fetch cross-origin stylesheets without CORS restrictions.
  const request = (async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "FETCH_STYLESHEET_TEXT",
        payload: { url }
      }) as { ok: true; payload: { text: string | null } };
      return response.payload.text;
    } catch {
      return null;
    }
  })();

  stylesheetTextCache.set(url, request);
  return request;
}

function parseCssTextToRules(cssText: string): AccessibleCssRules | null {
  const style = document.createElement("style");
  style.textContent = cssText;
  document.head.appendChild(style);

  const parsedSheet = style.sheet as CSSStyleSheet | null;
  if (!parsedSheet) {
    style.remove();
    return null;
  }

  try {
    return {
      rules: parsedSheet.cssRules,
      cleanup: () => style.remove()
    };
  } catch {
    style.remove();
    return null;
  }
}

export async function getAccessibleCssRules(
  sheet: CSSStyleSheet
): Promise<AccessibleCssRules | null> {
  try {
    return { rules: sheet.cssRules };
  } catch {
    if (!sheet.href) {
      return null;
    }

    const cssText = await fetchStylesheetText(sheet.href);
    if (!cssText) {
      return null;
    }

    return parseCssTextToRules(cssText);
  }
}
