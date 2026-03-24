import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CTABlock } from "@/components/CTABlock";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { ComparisonTable } from "@/components/ComparisonTable";
import { VerdictSummary } from "@/components/VerdictSummary";
import { WorkflowComparison } from "@/components/WorkflowComparison";
import { UseCaseComparison } from "@/components/UseCaseComparison";
import { csspeeperData as data } from "@/data/comparisons/csspeeper";
import "./page.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: data.meta.title,
  description: data.meta.description,
  alternates: { canonical: data.meta.canonicalPath },
};

export default function CompareVsCssPeeperPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section center>
          <Hero
            title={data.hero.title}
            subtitle={data.hero.subtitle}
            logoHref="/"
          />
        </Section>

        {data.verdict != null && (
          <Section>
            <VerdictSummary ours={data.verdict.ours} theirs={data.verdict.theirs} />
          </Section>
        )}

        {data.table != null && (
          <Section>
            <div className="compare-table-section">
              <SectionHeading
                title={`${data.tools.ours.name} vs ${data.tools.theirs.name}`}
                subtitle="Feature-by-feature breakdown."
                titleId="table-heading"
              />
              <ComparisonTable
                ours={data.tools.ours}
                theirs={data.tools.theirs}
                rows={data.table.rows}
              />
            </div>
          </Section>
        )}

        {data.workflow != null && (
          <Section>
            <WorkflowComparison
              title={data.workflow.title}
              subtitle={data.workflow.subtitle}
              ours={data.workflow.ours}
              theirs={data.workflow.theirs}
            />
          </Section>
        )}

        {data.useCases != null && (
          <Section>
            <UseCaseComparison
              title={data.useCases.title}
              subtitle={data.useCases.subtitle}
              ourTool={data.tools.ours.name}
              theirTool={data.tools.theirs.name}
              scenarios={data.useCases.scenarios}
            />
          </Section>
        )}

        {data.limitations != null && (
          <Section>
            <div className="compare-limitations">
              <SectionHeading
                title={data.limitations.title ?? "Limitations"}
                subtitle={data.limitations.subtitle}
                titleId="limitations-heading"
              />
              <ul className="compare-limitations-list" aria-labelledby="limitations-heading">
                {data.limitations.items.map((item) => (
                  <li key={item.heading} className="compare-limitations-item">
                    <strong className="compare-limitations-heading">{item.heading}</strong>
                    <p className="compare-limitations-desc">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        )}

        <Section id="faq">
          {data.faq != null ? (
            <FAQ subheading="FAQ" title="Common questions" items={data.faq} />
          ) : (
            <FAQ />
          )}
        </Section>

        <Section id="cta">
          <CTABlock />
        </Section>

        <Footer />
      </main>
    </>
  );
}
