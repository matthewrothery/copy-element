import { StructuredData } from "@/components/StructuredData";
import { faqPageSchema, type FaqSchemaItem } from "@/lib/seo";

type FaqSchemaProps = {
  items: FaqSchemaItem[];
  /** Full page URL for stable `@id`; omit for FAQ-only blocks without a page anchor. */
  pageUrl?: string;
};

export function FaqSchema({ items, pageUrl }: FaqSchemaProps): React.ReactElement {
  const schema = pageUrl
    ? faqPageSchema(items, pageUrl)
    : {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      };

  return <StructuredData data={schema} />;
}
