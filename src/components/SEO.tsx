import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://vwpartfinder.netlify.app'
const APP_NAME = import.meta.env.VITE_APP_NAME || 'VW PartFinder'
const OG_IMAGE = `${SITE_URL}/VWpartlogo.png`

const DEFAULT_DESCRIPTION = 'Find genuine Volkswagen spare parts across India. Search by model, part number, and trusted vendors for fast, reliable VW parts.'

const DEFAULT_KEYWORDS = [
  'VW parts',
  'Volkswagen parts',
  'VW spare parts',
  'Volkswagen spare parts India',
  'VW parts online',
  'Genuine VW parts',
  'VW part number finder',
  'Volkswagen parts by VIN',
  'VW Polo parts',
  'VW Vento parts',
  'VW Virtus parts',
  'VW Taigun parts',
  'VW brake pads',
  'VW engine parts',
  'Volkswagen OEM parts'
]

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Find Genuine Volkswagen Parts Online',
    description: 'Search genuine VW spare parts across India. Find the right Volkswagen part by model or part number with trusted vendors.'
  },
  '/vendors': {
    title: 'Verified VW Parts Vendors in India',
    description: 'Browse verified Volkswagen parts vendors across India. Compare availability, pricing, and ratings for genuine VW parts.'
  },
  '/faq': {
    title: 'VW Parts FAQ',
    description: 'Answers about VW part numbers, OEM vs aftermarket, compatibility checks, and ordering genuine Volkswagen parts online.'
  },
  '/contact': {
    title: 'Contact VW PartFinder',
    description: 'Get in touch with VW PartFinder for help finding genuine Volkswagen parts, orders, or vendor support.'
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: 'Read how VW PartFinder collects, uses, and protects your data when searching for Volkswagen parts.'
  },
  '/terms': {
    title: 'Terms of Service',
    description: 'Review the terms for using VW PartFinder to search and request Volkswagen spare parts.'
  }
}

const NOINDEX_PATHS = ['/auth', '/dashboard', '/request', '/vendor/request', '/profile']

const buildCanonical = (pathname: string) => {
  if (pathname === '/') return SITE_URL
  return `${SITE_URL}${pathname}`
}

const isNoIndex = (pathname: string) =>
  NOINDEX_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

export default function SEO() {
  const { pathname } = useLocation()

  const { title, description, canonical, robots, indexable } = useMemo(() => {
    const meta = PAGE_META[pathname] || PAGE_META['/']
    const pageTitle = `${meta.title} | ${APP_NAME}`
    const pageDescription = meta.description || DEFAULT_DESCRIPTION
    const canonicalUrl = buildCanonical(pathname)
    const noIndex = isNoIndex(pathname)

    return {
      title: pageTitle,
      description: pageDescription,
      canonical: canonicalUrl,
      robots: noIndex ? 'noindex, nofollow' : 'index, follow',
      indexable: !noIndex
    }
  }, [pathname])

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: SITE_URL,
    logo: OG_IMAGE
  }

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/vendors?query={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: canonical,
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: APP_NAME,
      url: SITE_URL
    }
  }

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={DEFAULT_KEYWORDS.join(', ')} />
      <meta name="robots" content={robots} />
      <meta name="author" content={APP_NAME} />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="en-IN" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={APP_NAME} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />

      {indexable && (
        <script type="application/ld+json">
          {JSON.stringify(orgSchema)}
        </script>
      )}
      {indexable && (
        <script type="application/ld+json">
          {JSON.stringify(webSiteSchema)}
        </script>
      )}
      {indexable && (
        <script type="application/ld+json">
          {JSON.stringify(webPageSchema)}
        </script>
      )}
    </Helmet>
  )
}
