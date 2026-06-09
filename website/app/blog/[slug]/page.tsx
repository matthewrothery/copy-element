import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleHeader, ArticleBody, ArticleCTA, SuggestedPosts } from "@/components/Article";
import { StructuredData } from "@/components/StructuredData";
import { getAllPosts, getPost } from "@/lib/parseBlog";
import { schemaIsoDateFromFrontmatter } from "@/lib/schemaHelpers";
import { SITE_URL } from "@/lib/publicConfig";
import { articleSchema, buildPageMetadata, buildNoIndexMetadata } from "@/lib/seo";
import "@/styles/blog.css";

export const dynamic = "force-static";

export function generateStaticParams(): { slug: string }[] {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post Not Found" };
  if (post.noindex) {
    return buildNoIndexMetadata({
      title: post.title,
      description: post.excerpt,
      path: `/blog/${slug}`,
    });
  }
  return buildPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.coverImage,
    openGraphType: "article",
  });
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

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const published = schemaIsoDateFromFrontmatter(post.date);

  return (
    <>
      <StructuredData
        data={articleSchema({
          headline: post.title,
          description: post.excerpt,
          url: postUrl,
          datePublished: published,
          authorName: post.author,
          image: post.coverImage,
          type: "BlogPosting",
        })}
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
