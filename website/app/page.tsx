import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SocialProofCards } from "@/components/SocialProofCards";
import { FeatureCarousel } from "@/components/FeatureCarousel";
import { FeatureSection } from "@/components/FeatureSection";
import { CTABlock } from "@/components/CTABlock";
import { Footer } from "@/components/Footer";

export default function Home(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <section className="section">
          <Hero />
        </section>

        <section className="section">
          <SocialProofCards />
        </section>

        <section className="section">
          <FeatureCarousel
            title="Record iPhone or iPad on your Mac"
            description="Connect your device with a USB cable and start recording. Add zooms and create mobile app demos with no effort."
            headingAlign="left"
            items={[
              {
                type: "video",
                title: "iPhone and iPad model detection",
                description:
                  "Screen Studio automatically detects the model and color of your device.",
                posterSrc: "https://picsum.photos/720/720",
                videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              },
              {
                type: "video",
                title: "Customize device frame and color",
                description:
                  "Screen Studio has a wide range of device frames and colors to choose from.",
                posterSrc: "https://picsum.photos/720/721",
                videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
              },
              {
                type: "image",
                title: "Easy iOS device recording",
                description:
                  "Connect your iPhone or iPad with a USB cable and start recording.",
                src: "https://picsum.photos/720/722",
                alt: "iPhone or iPad recording picker",
              },
            ]}
          />
        </section>

        <section className="section">
          <FeatureSection
            title="Capture & export"
            subtitle="Get clean HTML or JSX from any element. No extra markup or inline bloat."
            tabs={[
              {
                title: "One-click capture",
                description:
                  "Click any element on the page. Element Armory copies it with minimal, portable styles.",
              },
              {
                title: "HTML and JSX",
                description:
                  "Export as plain HTML or React JSX. Copy to clipboard or save to your library.",
              },
              {
                title: "Inline styles only",
                description:
                  "Only visual styles are included. No scripts, trackers, or unnecessary attributes.",
              },
            ]}
          />
        </section>

        <section className="section">
          <FeatureSection
            title="Snippet library"
            subtitle={
              <>
                <strong>Save and reuse.</strong> Build a library of UI components from any website.
              </>
            }
            tabs={[
              {
                title: "Save snippets",
                description: "Store captured elements in your library with a title and source URL.",
              },
              {
                title: "Copy anytime",
                description: "Copy HTML or JSX from your library without revisiting the original page.",
              },
              {
                title: "Quick preview",
                description: "Preview snippets before copying. Delete or organize as you like.",
              },
            ]}
          />
        </section>

        <section className="section">
          <FeatureSection
            title="Developer-friendly"
            subtitle="Minimal output. No bloat. Framework-neutral HTML and JSX."
            tabs={[
              {
                title: "Minimal CSS",
                description:
                  "Only display, position, margin, padding, font, color, background, border, flex, grid.",
              },
              {
                title: "No defaults",
                description: "Default values are omitted so your output stays small and readable.",
              },
              {
                title: "Portable",
                description: "Output works anywhere. No dependency on the original site or framework.",
              },
            ]}
          />
        </section>

        <section className="section" id="pricing">
          <CTABlock />
        </section>

        <Footer />
      </main>
    </>
  );
}
