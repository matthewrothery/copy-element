import { GoogleAuth } from "google-auth-library";

const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters";
const INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";
const INDEXING_API_QUOTA_PER_DAY = 200;

export function createAuth(credentialsJson: string): GoogleAuth {
  const credentials = JSON.parse(credentialsJson) as object;
  return new GoogleAuth({
    credentials,
    scopes: [SEARCH_CONSOLE_SCOPE, INDEXING_SCOPE],
  });
}

export async function submitSitemap(
  siteUrl: string,
  sitemapUrl: string,
  auth: GoogleAuth
): Promise<void> {
  const client = await auth.getClient();
  const encodedSite = encodeURIComponent(siteUrl);
  const encodedSitemap = encodeURIComponent(sitemapUrl);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodedSitemap}`;

  const response = await client.request({ url, method: "PUT" });
  if ((response.status ?? 200) >= 400) {
    throw new Error(`Sitemap submit failed: HTTP ${response.status}`);
  }
  console.log(`[gsc] Sitemap submitted: ${sitemapUrl}`);
}

export async function requestIndexing(
  urls: string[],
  auth: GoogleAuth
): Promise<void> {
  const client = await auth.getClient();
  const apiUrl = "https://indexing.googleapis.com/v3/urlNotifications:publish";

  let submitted = 0;
  for (const url of urls) {
    if (submitted >= INDEXING_API_QUOTA_PER_DAY) {
      console.warn(`[gsc] Indexing API quota (${INDEXING_API_QUOTA_PER_DAY}/day) reached — skipping remaining ${urls.length - submitted} URL(s).`);
      break;
    }
    try {
      const response = await client.request({
        url: apiUrl,
        method: "POST",
        data: { url, type: "URL_UPDATED" },
      });
      if ((response.status ?? 200) >= 400) {
        console.warn(`[gsc] Indexing request failed for ${url}: HTTP ${response.status}`);
      } else {
        console.log(`[gsc] Indexing requested for: ${url}`);
        submitted++;
      }
    } catch (err) {
      console.warn(`[gsc] Indexing request error for ${url}: ${(err as Error).message}`);
    }
  }
}
