import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ExampleDetail } from "@/components/ExampleDetail";
import { EXAMPLES, getExample } from "@/data/examples";

export const dynamic = "force-static";

export function generateStaticParams(): { slug: string }[] {
  return EXAMPLES.map((e) => ({ slug: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<{
  title: string;
  description: string;
  alternates?: { canonical: string };
  openGraph?: { title: string; description: string };
}> {
  const { slug } = await params;
  const ex = getExample(slug);
  if (!ex) return { title: "Not Found", description: "" };
  return {
    title: `${ex.name} – UI Examples – Element Armory`,
    description: ex.description,
    alternates: { canonical: `/examples/${slug}` },
    openGraph: {
      title: `${ex.name} – Element Armory`,
      description: ex.description,
    },
  };
}

export default async function ExamplePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const ex = getExample(slug);
  if (!ex) notFound();

  return (
    <>
      <Header />
      <main>
        <ExampleDetail example={ex} />
      </main>
      <Footer />
    </>
  );
}
