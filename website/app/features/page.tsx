import type { Metadata } from 'next'
import Image from 'next/image'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Section } from '@/components/Section'
import { SectionHeading } from '@/components/SectionHeading'
import { FeatureSection } from '@/components/FeatureSection'
import { FeatureGrid } from '@/components/FeatureGrid'
import { FeatureTable } from '@/components/FeatureTable'
import type { FeatureTableRow } from '@/components/FeatureTable'
import { CTABlock } from '@/components/CTABlock'
import { FAQ } from '@/components/FAQ'
import './page.css'
import { Hero } from '@/components/Hero'

export const dynamic = 'force-static'

const FEATURE_TABLE_ROWS: FeatureTableRow[] = [
  { feature: 'Capture any UI element in one click', status: 'yes' },
  { feature: 'Copy clean HTML with inline styles', status: 'yes' },
  { feature: 'Generate AI-ready prompts', status: 'yes' },
  {
    feature: 'Connect via MCP server',
    note: 'Works with Cursor, Windsurf, and any MCP-compatible editor.',
    status: 'yes'
  },
  { feature: 'Save to your personal library', status: 'yes' },
  { feature: 'Sync across devices', status: 'yes' },
  {
    feature: 'Advanced codebase-aware prompts',
    note: 'Includes your file structure, conventions, and style rules.',
    status: 'yes'
  }
]

export const metadata: Metadata = {
  title: 'Features – Element Armory',
  description:
    'Capture any UI element, copy clean HTML, generate AI-ready prompts, and pipe snippets directly into your editor via MCP.',
  alternates: { canonical: '/features' }
}

export default function FeaturesPage (): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section center>
          <Hero
            title='Become a UI master.'
            subtitle='Designed to help you capture, copy, and build UI faster than ever before.'
            media={
              <Image
                src='/assets/elementarmory.gif'
                alt='Element Armory'
                width={940}
                height={557}
              />
            }
          />
        </Section>

        <Section id='capture'>
          <FeatureSection
            subheading='Capture'
            title='One click. Clean code. Zero friction.'
            subtitle='Hover any element on any site and click. No DevTools, no copy-paste archaeology.'
            tabs={[
              {
                title: 'Capture any UI element in one click',
                description:
                  'Open Element Armory, hover any element, click. The extension extracts the full visual structure-layout, typography, color, spacing-so you can grab what you want without switching tools or writing a line.',
                image: '/assets/one-click-capture.png'
              },
              {
                title: 'Copy clean HTML with scoped CSS',
                description:
                  'Get minimal markup with a scoped CSS style block-only the visual rules that apply to the element. No scripts, no trackers, no framework dependencies-paste it into any project and it works.',
                image: '/assets/copy-code-snippet.png'
              }
            ]}
          />
        </Section>

        <Section id='ai'>
          <FeatureSection
            subheading='AI integration'
            title='Your AI tool already knows what to build.'
            subtitle={
              <>
                <strong>MCP server + AI-ready prompts.</strong> Element Armory
                pipes captured UI directly into Cursor, Claude, and any
                MCP-compatible editor.
              </>
            }
            tabs={[
              {
                title: 'Generate AI-ready prompts',
                description:
                  'Copy a structured prompt that includes the captured element, its markup, and a clear instruction-so you can hand off UI to your AI assistant with full structural context and get usable output immediately.',
                image: '/assets/copy-ai-prompt.png'
              },
              {
                title: 'Connect via MCP server',
                description:
                  "Connect Element Armory to Cursor, Windsurf, or any MCP-compatible editor. Captured elements land directly in your tool's context-so you can reference live snippets without any manual paste.",
                image: '/assets/copy-mcp-prompt.png'
              },
              {
                title: 'Advanced codebase-aware prompts',
                description:
                  'Generate prompts that include your existing file structure, component conventions, and style rules-so you can tell your AI exactly how to adapt the element to your codebase.',
                image: '/assets/copy-advanced-prompt.png'
              }
            ]}
          />
        </Section>

        <Section id='library'>
          <FeatureGrid
            subheading='Library'
            title='Your UI collection. Always one click away.'
            subtitle={
              <>
                <strong>Save once, reuse everywhere.</strong> Build a personal
                library of components worth keeping-synced across all your
                machines.
              </>
            }
            cards={[
              {
                title: 'Save to your personal library',
                description:
                  'After capturing, save the element with a title and source URL-so you can reuse it across projects without revisiting the original site.',
                image: '/assets/auto-save-capture.png',
                imageAlt: 'Saved snippets in the library panel'
              },
              {
                title: 'Sync across devices',
                description:
                  'Your library syncs to your account-so you can access your full collection from any machine, always up to date.',
                image: '/assets/copy-anytime.png',
                imageAlt: 'Library synced across multiple devices'
              }
            ]}
          />
        </Section>

        <Section id='all-features'>
          <div className='features-table-section'>
            <SectionHeading
              title='Everything in one place.'
              subtitle='The full feature set-no footnotes.'
              titleId='features-table-heading'
            />
            <FeatureTable rows={FEATURE_TABLE_ROWS} />
          </div>
        </Section>

        <Section id='faq'>
          <FAQ />
        </Section>

        <Section id='cta'>
          <CTABlock />
        </Section>

        <Footer />
      </main>
    </>
  )
}
