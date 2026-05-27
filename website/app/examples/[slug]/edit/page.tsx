import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ExampleDetail } from "@/components/ExampleDetail";
import { EXAMPLES, getExample } from "@/data/examples";
import { buildNoIndexMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export function generateStaticParams(): { slug: string }[] {
  return EXAMPLES.map((e) => ({ slug: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ex = getExample(slug);
  if (!ex) return { title: "Not Found" };
  return buildNoIndexMetadata({
    title: `Edit ${ex.name}`,
    description: ex.description,
    path: `/examples/${slug}/edit`,
  });
}

export default async function ExampleEditPage({
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
