import Link from "next/link";
import type { BlogPost } from "@/lib/parseBlog";
import "./SuggestedPosts.css";

type SuggestedPostsProps = {
  posts: BlogPost[];
};

export function SuggestedPosts({ posts }: SuggestedPostsProps): React.ReactElement | null {
  if (posts.length === 0) return null;

  return (
    <section className="suggested-posts">
      <h2 className="suggested-posts__heading">You might also like</h2>
      <ul className="suggested-posts__list">
        {posts.map((post) => (
          <li key={post.slug} className="suggested-posts__item">
            <Link href={`/blog/${post.slug}`} className="suggested-posts__link">
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt=""
                  className="suggested-posts__cover"
                  aria-hidden
                />
              )}
              <div className="suggested-posts__text">
                <span className="suggested-posts__title">{post.title}</span>
                <span className="suggested-posts__meta">{post.readTime}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
