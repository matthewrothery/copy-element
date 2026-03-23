export async function findImage(topic: string): Promise<string | undefined> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    console.warn("PIXABAY_API_KEY not set — skipping cover image");
    return undefined;
  }

  const query = encodeURIComponent(topic);
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${query}&image_type=photo&orientation=horizontal&min_width=1200&per_page=5`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Pixabay request failed: ${res.status}`);
      return undefined;
    }

    const data = (await res.json()) as {
      hits?: Array<{ largeImageURL: string }>;
    };

    const first = data.hits?.[0];
    return first?.largeImageURL;
  } catch (err) {
    console.warn("Pixabay fetch error:", err);
    return undefined;
  }
}
