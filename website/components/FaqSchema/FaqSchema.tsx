type FaqItem = {
  question: string;
  answer: string;
};

type FaqSchemaProps = {
  items: FaqItem[];
};

export function FaqSchema({ items }: FaqSchemaProps): React.ReactElement {
  const schema = {
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
