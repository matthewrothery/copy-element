import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ExampleLanding } from "@/components/ExampleLanding";
import { StructuredData } from "@/components/StructuredData";
import { EXAMPLES, getExample } from "@/data/examples";
import { buildPageMetadata, webPageSchema } from "@/lib/seo";

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
  return buildPageMetadata({
    title: ex.name,
    description: ex.description,
    path: `/examples/${slug}`,
  });
}

export default async function ExamplePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const ex = getExample(slug);
  if (!ex) notFound();

  const path = `/examples/${slug}`;

  return (
    <>
      <StructuredData
        data={webPageSchema({
          name: ex.name,
          description: ex.description,
          path,
        })}
      />
      <Header />
      <main>
        <ExampleLanding example={ex} />
      </main>
      <Footer />
    </>
  );
}
