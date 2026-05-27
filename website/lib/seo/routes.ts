/** Indexable static marketing and utility paths for sitemap generation. */
export const STATIC_SITEMAP_ROUTES: Array<{
  path: string;
  priority?: number;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
}> = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/product", priority: 0.9, changeFrequency: "monthly" },
  { path: "/features", priority: 0.9, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/topics", priority: 0.9, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/examples", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tools/html-to-react", priority: 0.8, changeFrequency: "monthly" },
  { path: "/support", priority: 0.6, changeFrequency: "monthly" },
  { path: "/changelog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/roadmap", priority: 0.6, changeFrequency: "monthly" },
  { path: "/compare/element-armory-vs-divmagic", priority: 0.8, changeFrequency: "monthly" },
  { path: "/compare/element-armory-vs-snipcss", priority: 0.8, changeFrequency: "monthly" },
  { path: "/compare/element-armory-vs-css-scan", priority: 0.8, changeFrequency: "monthly" },
  { path: "/compare/element-armory-vs-copycss", priority: 0.8, changeFrequency: "monthly" },
  { path: "/compare/element-armory-vs-visbug", priority: 0.8, changeFrequency: "monthly" },
  { path: "/compare/element-armory-vs-csspeeper", priority: 0.8, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.4, changeFrequency: "yearly" },
  { path: "/url-sitemap", priority: 0.3, changeFrequency: "monthly" },
];
