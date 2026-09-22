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

/**
 * Minimal Organization node (`#organization`) for pages whose other nodes reference it as publisher / worksFor —
 * the full RealEstateAgent graph only lives on the homepage, so without this the reference would dangle.
 */
export function organizationNode(seo: SeoShared, origin: string): JsonLd {
    const org = seo.organization;
    return {
        '@type': ['RealEstateAgent', 'Organization'],
        '@id': `${origin}/#organization`,
        name: org.name,
        url: origin,
        logo: { '@type': 'ImageObject', url: org.logo },
        ...(org.sameAs.length ? { sameAs: org.sameAs } : {}),
    };
}

export function article(input: {
    headline: string;
    description: string;
    url: string;
    image?: { url: string; width: number; height: number } | string;
    datePublished: string;
    dateModified?: string;
    authorName: string;
    authorUrl?: string;
    authorImage?: string | null;
    publisherId: string;
    inLanguage?: string;
    section?: string | null;
    keywords?: string[];
    wordCount?: number;
}): JsonLd {
    const image =
        typeof input.image === 'string'
            ? [input.image]
            : input.image
              ? [{ '@type': 'ImageObject', url: input.image.url, width: input.image.width, height: input.image.height }]
              : undefined;
    return {
        '@type': 'Article',
        headline: input.headline,
        description: input.description,
        mainEntityOfPage: input.url,
        url: input.url,
        ...(image ? { image } : {}),
        datePublished: input.datePublished,
        dateModified: input.dateModified ?? input.datePublished,
        ...(input.inLanguage ? { inLanguage: input.inLanguage } : {}),
        ...(input.section ? { articleSection: input.section } : {}),
        ...(input.keywords?.length ? { keywords: input.keywords.join(', ') } : {}),
        ...(input.wordCount ? { wordCount: input.wordCount } : {}),
        author: {
            '@type': 'Person',
            name: input.authorName,
            ...(input.authorUrl ? { url: input.authorUrl } : {}),
            ...(input.authorImage ? { image: input.authorImage } : {}),
            worksFor: { '@id': input.publisherId },
        },
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

/** Language codes (BCP 47) behind the team members' flags. */
const FLAG_LANGUAGES: Record<string, string> = { FR: 'fr', GB: 'en', US: 'en' };

/**
 * `Person` nodes for the advisors of the About page (E-E-A-T, 2026-09-22): one per team member, `worksFor` the
 * organisation node, `knowsLanguage` derived from the flags, `jobTitle` from the role. The organisation lists them as
 * `employee` through `teamOrganizationNode()`.
 */
export function teamNodes(members: { name: string; role: string; flags: string[]; photo: string }[], origin: string): JsonLd[] {
    return members.map((member, i) => ({
        '@type': 'Person',
        '@id': `${origin}/#person-${i + 1}`,
        name: member.name,
        jobTitle: member.role,
        image: member.photo.startsWith('http') ? member.photo : `${origin}${member.photo}`,
        knowsLanguage: Array.from(new Set(member.flags.map((flag) => FLAG_LANGUAGES[flag]).filter(Boolean))),
        worksFor: { '@id': `${origin}/#organization` },
    }));
}

/** The organisation node with its `employee` references to the team's `Person` nodes. */
export function teamOrganizationNode(seo: SeoShared, origin: string, teamCount: number): JsonLd {
    return { ...organizationNode(seo, origin), employee: Array.from({ length: teamCount }, (_, i) => ({ '@id': `${origin}/#person-${i + 1}` })) };
}

/**
 * `Service` node of a free service offered by the agency (valuation page, 2026-09-22): provider = the organisation
 * node, served in Paris, offered at no charge.
 */
export function serviceNode(input: { name: string; description: string; url: string; serviceType: string }, origin: string): JsonLd {
    return {
        '@type': 'Service',
        '@id': `${input.url}#service`,
        name: input.name,
        serviceType: input.serviceType,
        description: input.description,
        url: input.url,
        provider: { '@id': `${origin}/#organization` },
        areaServed: { '@type': 'City', name: 'Paris' },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
    };
}
