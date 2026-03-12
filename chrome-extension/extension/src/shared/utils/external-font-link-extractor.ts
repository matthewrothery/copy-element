/**
 * Extracts external font stylesheet links for fonts that couldn't be accessed
 * due to CORS restrictions (e.g., Google Fonts, Adobe Fonts).
 */

const FONT_CDN_PATTERNS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "use.typekit.net",
  "fonts.shopify.com",
  "fast.fonts.net",
  "cloud.typography.com",
  "use.fontawesome.com",
  "fonts.adobe.com"
];

/**
 * Checks if a URL is from a known font CDN.
 */
function isFontCdnUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return FONT_CDN_PATTERNS.some((pattern) => urlObj.hostname.includes(pattern));
  } catch {
    return false;
  }
}

/**
 * Extracts external font stylesheet links from the document.
 * Only returns links from known font CDN domains.
 */
export function extractExternalFontLinks(): string[] {
  const fontLinks: string[] = [];
  const linkElements = document.querySelectorAll('link[rel="stylesheet"]');

  linkElements.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && isFontCdnUrl(href)) {
      // Serialize the link element
      const serialized = link.outerHTML;
      fontLinks.push(serialized);
    }
  });

  return fontLinks;
}

/**
 * Extracts external font preconnect and preload links.
 * These improve font loading performance.
 */
export function extractFontPreloadLinks(): string[] {
  const preloadLinks: string[] = [];
  const linkElements = document.querySelectorAll('link[rel="preconnect"], link[rel="dns-prefetch"], link[rel="preload"]');

  linkElements.forEach((link) => {
    const href = link.getAttribute("href");
    const as = link.getAttribute("as");
    
    // Include preconnect/dns-prefetch to font CDNs
    if (href && isFontCdnUrl(href)) {
      preloadLinks.push(link.outerHTML);
    }
    
    // Include font preloads
    if (as === "font" || (href && href.match(/\.(woff2?|ttf|otf|eot)$/i))) {
      preloadLinks.push(link.outerHTML);
    }
  });

  return preloadLinks;
}

/**
 * Extracts all font-related external links (stylesheets and preloads).
 */
export function extractAllFontLinks(): {
  stylesheets: string[];
  preloads: string[];
} {
  return {
    stylesheets: extractExternalFontLinks(),
    preloads: extractFontPreloadLinks()
  };
}
