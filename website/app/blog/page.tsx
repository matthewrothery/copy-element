import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StructuredData } from "@/components/StructuredData";
import { getAllPosts } from "@/lib/parseBlog";
import { SITE_URL } from "@/lib/publicConfig";
import { buildPageMetadata, collectionPageSchema } from "@/lib/seo";
import "@/styles/blog.css";

export const dynamic = "force-static";

const BLOG_INDEX_TITLE = "UI Capture Guides and Product Updates";
const BLOG_INDEX_DESCRIPTION =
  "Read Element Armory guides on copying UI from websites, AI coding workflows, Chrome extension tips, and product updates.";

export const metadata = buildPageMetadata({
  title: BLOG_INDEX_TITLE,
  description: BLOG_INDEX_DESCRIPTION,
  path: "/blog",
});

export default function BlogPage(): React.ReactElement {
  const posts = getAllPosts();
  const pageUrl = `${SITE_URL}/blog`;

  return (
    <>
      <StructuredData
        data={collectionPageSchema({
          name: BLOG_INDEX_TITLE,
          description: BLOG_INDEX_DESCRIPTION,
          url: pageUrl,
          hasPart: posts.map((post) => ({
            name: post.title,
            url: `${SITE_URL}/blog/${post.slug}`,
            description: post.excerpt,
            type: "BlogPosting",
          })),
        })}
      />
      <Header />
      <main className="blog-page">
        <h1 className="blog-index__heading">Blog</h1>
        <ul className="blog-index">
          {posts.map((post) => (
            <li key={post.slug} className="blog-card">
              <Link href={`/blog/${post.slug}`} className="blog-card__link">
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt=""
                    className="blog-card__cover"
                    aria-hidden
                  />
                )}
                <h2 className="blog-card__title">{post.title}</h2>
                <p className="blog-card__excerpt">{post.excerpt}</p>
                <div className="blog-card__meta">
                  <span>{post.author}</span>
                  <span className="blog-card__dot" aria-hidden>·</span>
                  <span>{post.date}</span>
                  <span className="blog-card__dot" aria-hidden>·</span>
                  <span>{post.readTime}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
