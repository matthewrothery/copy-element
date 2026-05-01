import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleHeader, ArticleBody, ArticleCTA, SuggestedPosts } from "@/components/Article";
import { getAllPosts, getPost } from "@/lib/parseBlog";
import { schemaIsoDateFromFrontmatter } from "@/lib/schemaHelpers";
import "@/styles/blog.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elementarmory.com";

export const dynamic = "force-static";

export function generateStaticParams(): { slug: string }[] {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<{ title: string; description: string; alternates?: { canonical: string } }> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post Not Found", description: "" };
  return {
    title: `${post.title} – Element Armory`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const suggested = getAllPosts()
    .filter((p) => p.slug !== slug)
    .slice(0, 4);

  const postUrl = `${BASE_URL}/blog/${post.slug}`;
  const published = schemaIsoDateFromFrontmatter(post.date);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${postUrl}#article`,
    headline: post.title,
    description: post.excerpt,
    datePublished: published,
    dateModified: published,
    inLanguage: "en-US",
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Element Armory",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${postUrl}#webpage`,
      url: postUrl,
    },
    url: postUrl,
    ...(post.coverImage ? { image: post.coverImage } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Header />
      <main className="blog-page">
        <ArticleHeader
          title={post.title}
          author={post.author}
          date={post.date}
          readTime={post.readTime}
          coverImage={post.coverImage}
        />
        <ArticleBody contentHtml={post.contentHtml} />
        <ArticleCTA />
        <SuggestedPosts posts={suggested} />
      </main>
      <Footer />
    </>
  );
}
