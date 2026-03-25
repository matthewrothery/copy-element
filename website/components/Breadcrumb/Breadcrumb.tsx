import Link from "next/link";
import "./Breadcrumb.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elementarmory.com";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps): React.ReactElement {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${BASE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <ol className="breadcrumb-list">
          {items.map((item, index) => (
            <li key={index} className="breadcrumb-item">
              {index < items.length - 1 ? (
                <>
                  {item.href ? (
                    <Link href={item.href} className="breadcrumb-link">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="breadcrumb-link">{item.label}</span>
                  )}
                  <span className="breadcrumb-separator" aria-hidden="true">/</span>
                </>
              ) : (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
