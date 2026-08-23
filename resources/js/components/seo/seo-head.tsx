import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

export type JsonLd = Record<string, unknown>;

type SeoHeadProps = {
    title: string;
    /** Set to false for the homepage to use the raw site name as title. */
    withSuffix?: boolean;
    description?: string;
    /** Absolute canonical URL. Defaults to the current URL without query string. */
    canonical?: string;
    /** Prevent indexing (filtered/paginated search results, private or thin pages). */
    noindex?: boolean;
    /** Absolute URL to a 1200×630 image. Falls back to the site default. */
    image?: string;
    imageAlt?: string;
    type?: 'website' | 'article' | 'profile' | 'product';
    /** Article metadata (only used when type === 'article'). */
    article?: { publishedTime?: string; modifiedTime?: string; author?: string; section?: string; tags?: string[] };
    /** Alternate language versions: { 'en': 'https://…/en/page', 'x-default': '…' } */
    alternates?: Record<string, string>;
    prev?: string | null;
    next?: string | null;
    /** JSON-LD objects (without @context). See resources/js/lib/json-ld.ts for builders. */
    jsonLd?: JsonLd | JsonLd[];
    children?: React.ReactNode;
};

export default function SeoHead({
    title,
    withSuffix = true,
    description,
    canonical,
    noindex = false,
    image,
    imageAlt,
    type = 'website',
    article,
    alternates,
    prev,
    next,
    jsonLd,
    children,
}: SeoHeadProps) {
    const { seo, ziggy, localization } = usePage<SharedData>().props;
    const url = canonical ?? ziggy.location.split(/[?#]/)[0];
    const fullTitle = withSuffix ? `${title}${seo.separator}${seo.siteName}` : title;
    const desc = description ?? seo.description;
    const img = image ?? seo.image;
    const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    // hreflang: explicit `alternates` win; otherwise the current page in every locale (skipped on noindex pages).
    const hreflangs = alternates ?? (noindex ? undefined : localization?.alternates);
    const otherLocales = (localization?.locales ?? []).filter((l) => !l.current);

    return (
        <Head>
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            <link rel="canonical" href={url} />
            <meta
                name="robots"
                content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}
            />
            {prev && <link rel="prev" href={prev} />}
            {next && <link rel="next" href={next} />}
            {hreflangs && Object.entries(hreflangs).map(([lang, href]) => <link key={lang} rel="alternate" {...{ hreflang: lang }} href={href} />)}

            <meta property="og:site_name" content={seo.siteName} />
            <meta property="og:locale" content={localization?.regional ?? seo.locale} />
            {otherLocales.map((l) => (
                <meta key={l.code} property="og:locale:alternate" content={l.regional} />
            ))}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={img} />
            {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
            {type === 'article' && article?.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
            {type === 'article' && article?.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
            {type === 'article' && article?.author && <meta property="article:author" content={article.author} />}
            {type === 'article' && article?.section && <meta property="article:section" content={article.section} />}
            {type === 'article' && article?.tags?.map((tag) => <meta key={tag} property="article:tag" content={tag} />)}

            <meta name="twitter:card" content="summary_large_image" />
            {seo.twitter && <meta name="twitter:site" content={seo.twitter} />}
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:image" content={img} />

            {ld.map((item, i) => (
                <script key={i} type="application/ld+json">
                    {JSON.stringify({ '@context': 'https://schema.org', ...item })}
                </script>
            ))}
            {children}
        </Head>
    );
}
