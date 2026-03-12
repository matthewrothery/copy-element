const CHROME_STORE_URL = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#";

export function Footer(): React.ReactElement {
  return (
    <footer className="footer" role="contentinfo">
      <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
        Chrome Web Store
      </a>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
    </footer>
  );
}
