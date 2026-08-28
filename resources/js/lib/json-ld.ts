import { type JsonLd } from '@/components/seo/seo-head';
import { type SeoShared } from '@/types';

/** RealEstateAgent (Organization subtype Google understands) + WebSite (with Sitelinks SearchAction). Use once, on the homepage. */
export function siteGraph(seo: SeoShared, origin: string, searchUrl: string): JsonLd[] {
    const { organization: org, hours, reviews } = seo;
    const address =
        org.address.street || org.address.city
            ? {
                  address: {
                      '@type': 'PostalAddress',
                      ...(org.address.street ? { streetAddress: org.address.street } : {}),
                      ...(org.address.postal_code ? { postalCode: org.address.postal_code } : {}),
                      ...(org.address.city ? { addressLocality: org.address.city } : {}),
                      addressCountry: org.address.country ?? 'FR',
                  },
              }
            : {};
    return [
        {
            '@type': ['RealEstateAgent', 'Organization'],
            '@id': `${origin}/#organization`,
            name: org.name,
            url: origin,
            logo: { '@type': 'ImageObject', url: org.logo },
            image: org.logo,
            ...(org.phone ? { telephone: org.phone } : {}),
            ...(org.email ? { email: org.email } : {}),
            ...address,
            ...(org.address.city ? { areaServed: { '@type': 'City', name: org.address.city } } : {}),
            ...(hours?.spec ? { openingHours: hours.spec } : {}),
            priceRange: '€€€€',
            ...(reviews
                ? {
                      aggregateRating: {
                          '@type': 'AggregateRating',
                          ratingValue: reviews.rating,
                          reviewCount: reviews.count,
                          bestRating: 5,
                          worstRating: 1,
                      },
                  }
                : {}),
            ...(org.sameAs.length ? { sameAs: org.sameAs } : {}),
        },
        {
            '@type': 'WebSite',
            '@id': `${origin}/#website`,
            name: seo.siteName,
            url: origin,
            inLanguage: seo.locale.replace('_', '-'),
            publisher: { '@id': `${origin}/#organization` },
            potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: `${searchUrl}?q={search_term_string}` },
                'query-input': 'required name=search_term_string',
            },
        },
    ];
}

export type Crumb = { name: string; url?: string };

export function breadcrumbList(crumbs: Crumb[], origin: string): JsonLd {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.name,
            ...(c.url ? { item: c.url.startsWith('http') ? c.url : `${origin}${c.url}` } : {}),
        })),
    };
}

export type Faq = { question: string; answer: string };

/** FAQPage — great for GEO: LLMs and AI Overviews quote Q/A pairs directly. */
export function faqPage(items: Faq[]): JsonLd {
    return {
        '@type': 'FAQPage',
        mainEntity: items.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
    };
}

export function article(input: {
    headline: string;
    description: string;
    url: string;
    image?: string;
    datePublished: string;
    dateModified?: string;
    authorName: string;
    authorUrl?: string;
    publisherId: string;
}): JsonLd {
    return {
        '@type': 'Article',
        headline: input.headline,
        description: input.description,
        mainEntityOfPage: input.url,
        ...(input.image ? { image: [input.image] } : {}),
        datePublished: input.datePublished,
        dateModified: input.dateModified ?? input.datePublished,
        author: { '@type': 'Person', name: input.authorName, ...(input.authorUrl ? { url: input.authorUrl } : {}) },
        publisher: { '@id': input.publisherId },
    };
}

export function itemList(items: { name: string; url: string }[]): JsonLd {
    return {
        '@type': 'ItemList',
        itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: it.url })),
    };
}

/** ContactPage whose main entity is the agency's sales ContactPoint (phone, e-mail, FR/EN, opening hours). */
export function contactPage(seo: SeoShared, origin: string, url: string, name: string): JsonLd {
    const { organization: org, hours } = seo;
    return {
        '@type': 'ContactPage',
        name,
        url,
        about: { '@id': `${origin}/#organization` },
        mainEntity: {
            '@type': 'RealEstateAgent',
            '@id': `${origin}/#organization`,
            name: org.name,
            ...(org.phone ? { telephone: org.phone } : {}),
            ...(org.email ? { email: org.email } : {}),
            ...(hours?.spec ? { openingHours: hours.spec } : {}),
            contactPoint: [
                {
                    '@type': 'ContactPoint',
                    contactType: 'sales',
                    ...(org.phone ? { telephone: org.phone } : {}),
                    ...(org.email ? { email: org.email } : {}),
                    availableLanguage: ['fr', 'en'],
                    ...(hours?.spec ? { hoursAvailable: hours.spec } : {}),
                },
            ],
        },
    };
}
