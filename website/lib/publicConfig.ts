const DEFAULT_CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/element-armory-%E2%80%93-capture/ihndemikooddnhleamneebgedomkench";

export const CHROME_STORE_URL =
  process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? DEFAULT_CHROME_STORE_URL;
