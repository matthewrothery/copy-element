import Link from "next/link";
import Image from "next/image";
import {
  HandMetal,
  MessageCircle,
  Bookmark,
  Play,
  Share2,
} from "lucide-react";
import { Header } from "@/components/Header";
import "@/styles/blog.css";

export const dynamic = "force-static";

export const metadata = {
  title: "Blog – Element Capture",
  description: "Element Capture blog: product updates and tips.",
};

const EXAMPLE_POST = {
  title:
    "Switching/Migrating from Shopify Billing API to Managed Pricing for an Existing App",
  author: { name: "Ollie" },
  readTime: "3 min read",
  date: "Jan 10, 2025",
  claps: 108,
  responses: 2,
};

function BlogPostHeader(): React.ReactElement {
  const { title, author, readTime, date, claps, responses } = EXAMPLE_POST;
  return (
    <header className="blog-post-header">
      <h1 className="blog-post-title">{title}</h1>
      <div className="blog-post-byline">
        <div className="blog-post-byline-left">
          <div className="blog-post-author-wrap">
            <Image
              className="blog-post-avatar"
              src="https://miro.medium.com/v2/resize:fill:64:64/1*7KlgYKEbs4TSSuTNCVsAEw.png"
              alt={author.name}
              width={36}
              height={36}
              unoptimized
            />
            <span className="blog-post-author-name">{author.name}</span>
            <button type="button" className="blog-post-follow" aria-label="Follow author">
              Follow
            </button>
          </div>
        </div>
        <div className="blog-post-meta">
          <span>{readTime}</span>
          <span>{date}</span>
        </div>
      </div>
      <div className="blog-post-actions">
        <button type="button" aria-label="Clap">
          <HandMetal size={24} aria-hidden />
          <span>{claps}</span>
        </button>
        <button type="button" aria-label="Responses">
          <MessageCircle size={24} aria-hidden />
          <span>{responses}</span>
        </button>
        <button type="button" aria-label="Add to list">
          <Bookmark size={24} aria-hidden />
        </button>
        <button type="button" aria-label="Listen">
          <Play size={24} aria-hidden />
          <span>Listen</span>
        </button>
        <button type="button" aria-label="Share post">
          <Share2 size={24} aria-hidden />
          <span>Share</span>
        </button>
      </div>
    </header>
  );
}

function BlogPostBody(): React.ReactElement {
  return (
    <article className="blog-post-body">
      <p>
        Migrating an existing Shopify app from the Billing API to Managed Pricing
        involves updating your app&apos;s subscription flow, handling existing
        merchants on legacy plans, and ensuring the Partner Dashboard and
        checkout experience stay consistent.
      </p>
      <p>
        This post walks through the steps we took: moving from recurring
        Application Charges to Managed Pricing, communicating the change to
        current customers, and testing the new flow end-to-end before launch.
      </p>
    </article>
  );
}

export default function BlogPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main className="blog-page">
        <BlogPostHeader />
        <BlogPostBody />
      </main>
    </>
  );
}
