import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getAllPosts } from "@/lib/parseBlog";
import "@/styles/blog.css";

export const dynamic = "force-static";

export const metadata = {
  title: "Blog – Element Armory",
  description: "Element Armory blog: product updates and tips.",
};

export default function BlogPage(): React.ReactElement {
  const posts = getAllPosts();

  return (
    <>
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
