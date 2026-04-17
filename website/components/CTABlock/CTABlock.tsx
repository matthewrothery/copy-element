import Link from 'next/link'
import { ChromeStoreCtaLabel } from '@/components/ChromeStoreCtaLabel'
import { CHROME_STORE_URL } from '@/lib/publicConfig'
import type { CTABlockProps, CTABlockFeature } from './types'
import './CTABlock.css'

const DEFAULT_TITLE = 'Your first capture is one click away.'
const DEFAULT_SUBTITLE =
  "Install the extension and you're ready. No sign-up required."
const DEFAULT_CTA_HREF = CHROME_STORE_URL

const DEFAULT_FEATURES: CTABlockFeature[] = [
  {
    title: 'View examples',
    description: 'See how Element Armory can help you build UI faster.',
    href: '/examples',
    linkLabel: 'See examples',
    icon: 'tag'
  },
  {
    title: 'Get started',
    description: "Install the extension and you're ready. No sign-up required.",
    href: DEFAULT_CTA_HREF,
    linkLabel: 'Add to Chrome',
    icon: 'code'
  }
]

function ArrowIcon (): React.ReactElement {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M8.84586 2.44609C9.04589 2.24613 9.31715 2.13379 9.59999 2.13379C9.88283 2.13379 10.1541 2.24613 10.3541 2.44609L15.1541 7.2461C15.3541 7.44612 15.4664 7.71739 15.4664 8.00023C15.4664 8.28307 15.3541 8.55433 15.1541 8.75436L10.3541 13.5544C10.1529 13.7487 9.88351 13.8562 9.60383 13.8537C9.32415 13.8513 9.05662 13.7391 8.85885 13.5414C8.66108 13.3436 8.5489 13.0761 8.54647 12.7964C8.54404 12.5167 8.65156 12.2473 8.84586 12.0461L11.7333 9.06689H1.59999C1.31709 9.06689 1.04578 8.95451 0.845745 8.75448C0.645706 8.55444 0.533325 8.28313 0.533325 8.00023C0.533325 7.71733 0.645706 7.44602 0.845745 7.24598C1.04578 7.04594 1.31709 6.93356 1.59999 6.93356H11.7333L8.84586 3.95436C8.64589 3.75433 8.53355 3.48307 8.53355 3.20023C8.53355 2.91739 8.64589 2.64612 8.84586 2.44609Z'
        fill='#FFFFFF'
      />
    </svg>
  )
}

function TagIcon (): React.ReactElement {
  return (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='cta-block-feature-icon'
      aria-hidden
    >
      <path
        d='M7.98 10.1c.58.58 1.53.58 2.12 0 .59-.59.59-1.54 0-2.12-.59-.59-1.54-.59-2.12 0-.59.58-.59 1.53 0 2.12Z'
        fill='currentColor'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M12.48 5.05c-.54-.54-1.27-.82-2.03-.8L5.83 4.4a1.2 1.2 0 0 0-.83.35L4.62 5.33a1.2 1.2 0 0 0-.35.83l-.15 4.61c-.02.76.27 1.5.8 2.03l7.64 7.64c1.07 1.08 2.82 1.08 3.9 0l3.42-3.43c1.08-1.07 1.08-2.82 0-3.9l-7.64-7.63Zm-1.98.7c.35-.01.68.12.93.37l6.64 6.64c.49.48.49 1.28 0 1.77l-3.54 3.54c-.48.49-1.28.49-1.77 0L6.12 11.42a1.2 1.2 0 0 1-.35-.84l.14-3.32 1.28-1.28 3.5-.15Z'
        fill='currentColor'
      />
    </svg>
  )
}

function CodeIcon (): React.ReactElement {
  return (
    <svg
      width='24'
      height='24'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='cta-block-feature-icon'
      aria-hidden
    >
      <path
        d='M8.37 1.64c.09-.46.54-.76 1-.67.46.09.76.54.67 1L7.63 14.36c-.09.46-.54.76-1 .67s-.76-.54-.67-1Z'
        fill='currentColor'
      />
      <path
        d='M5.2 3.4c.33.33.33.87 0 1.2L1.8 8l3.4 3.4c.33.33.33.87 0 1.2-.33.33-.87.33-1.2 0L.4 9c-.25-.25-.4-.6-.4-.96v-.08c0-.36.14-.7.4-.95L3.99 3.4c.33-.33.87-.33 1.2 0Z'
        fill='currentColor'
      />
      <path
        d='M11.4 4c.33-.33.87-.33 1.2 0l3 3c.25.25.4.6.4.95v.09c0 .36-.14.7-.4.95l-3 3c-.33.33-.87.33-1.2 0-.33-.33-.33-.87 0-1.2l3.4-3.4-3.4-3.4c-.33-.33-.33-.87 0-1.2Z'
        fill='currentColor'
      />
    </svg>
  )
}

function renderFeatureIcon (icon: CTABlockFeature['icon']): React.ReactNode {
  if (icon === 'tag') return <TagIcon />
  if (icon === 'code') return <CodeIcon />
  if (icon != null && typeof icon !== 'string') return icon
  return <TagIcon />
}

function isInternalHref (href: string): boolean {
  return href.startsWith('/') || href.startsWith('#')
}

export function CTABlock ({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  ctaHref = DEFAULT_CTA_HREF,
  ctaLabel = <ChromeStoreCtaLabel />,
  secondaryCtaHref,
  secondaryCtaLabel,
  features = DEFAULT_FEATURES
}: CTABlockProps): React.ReactElement {
  return (
    <section className='cta-block' aria-labelledby='cta-title'>
      <div className='cta-block-inner'>
        <div className='cta-block-content'>
          <div className='cta-block-text'>
            <h2 id='cta-title' className='cta-block-title'>
              {title}
            </h2>
            {subtitle != null && (
              <p className='cta-block-subtitle'>{subtitle}</p>
            )}
          </div>
          <div className='cta-block-actions'>
            <a
              className='cta-block-btn cta-block-btn-primary'
              href={ctaHref}
              target='_blank'
              rel='noopener noreferrer'
            >
              {ctaLabel}
              <ArrowIcon />
            </a>
            {secondaryCtaHref != null &&
              secondaryCtaLabel != null &&
              (isInternalHref(secondaryCtaHref) ? (
                <Link
                  className='cta-block-btn cta-block-btn-secondary'
                  href={secondaryCtaHref}
                >
                  {secondaryCtaLabel}
                </Link>
              ) : (
                <a
                  className='cta-block-btn cta-block-btn-secondary'
                  href={secondaryCtaHref}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {secondaryCtaLabel}
                </a>
              ))}
          </div>
        </div>
        <div className='cta-block-features'>
          {features.map(feature => (
            <div key={feature.title} className='cta-block-feature-card'>
              <div className='cta-block-feature-detail'>
                <div className='cta-block-feature-icon-wrap'>
                  {renderFeatureIcon(feature.icon)}
                </div>
                <div className='cta-block-feature-body'>
                  <h4 className='cta-block-feature-title'>{feature.title}</h4>
                  <p className='cta-block-feature-desc'>
                    {feature.description}
                  </p>
                </div>
                <div className='cta-block-feature-footer'>
                  {isInternalHref(feature.href) ? (
                    <Link
                      className='cta-block-feature-link'
                      href={feature.href}
                    >
                      {feature.linkLabel}
                      <span className='cta-block-feature-link-arrow'>
                        <ArrowIcon />
                      </span>
                    </Link>
                  ) : (
                    <a
                      className='cta-block-feature-link'
                      href={feature.href}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {feature.linkLabel}
                      <span className='cta-block-feature-link-arrow'>
                        <ArrowIcon />
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
