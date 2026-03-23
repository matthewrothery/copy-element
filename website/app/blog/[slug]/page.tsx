import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleHeader, ArticleBody, SuggestedPosts } from "@/components/Article";
import { getAllPosts, getPost } from "@/lib/parseBlog";
import "@/styles/blog.css";

export const dynamic = "force-static";

export function generateStaticParams(): { slug: string }[] {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<{ title: string; description: string }> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post Not Found", description: "" };
  return {
    title: `${post.title} – Element Armory`,
    description: post.excerpt,
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

  return (
    <>
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
        <SuggestedPosts posts={suggested} />
      </main>
      <Footer />
    </>
  );
}
