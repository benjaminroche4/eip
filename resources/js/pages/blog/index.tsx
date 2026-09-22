import BlogCategoryFilter from '@/components/blog/blog-category-filter';
import BlogFeaturedPost from '@/components/blog/blog-featured-post';
import BlogPagination from '@/components/blog/blog-pagination';
import BlogPostCard from '@/components/blog/blog-post-card';
import { type BlogFilter, type BlogPostSummary } from '@/components/blog/types';
import CtaCard from '@/components/home/cta-card';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { linkClass } from '@/lib/hover-surface';
import { breadcrumbList, itemList } from '@/lib/json-ld';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { type CSSProperties, useEffect, useState } from 'react';

type Props = {
    posts: { data: BlogPostSummary[]; total: number; current_page: number; last_page: number };
    /** Latest article of the locale, whatever the active filter: shown « à la une » on page 1. */
    featured: BlogPostSummary | null;
    filter: BlogFilter;
    indexing: { noindex: boolean; canonical: string; prev: string | null; next: string | null };
};

/** Listing: centred eyebrow + h1 + answer-first intro (same header as the valuation page), latest post "à la une" on page 1, category tabs, then the grid. */
export default function BlogIndex({ posts, featured, filter, indexing }: Props) {
    const { t, tc } = useTranslation();
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('blog.breadcrumb'), url: route('blog.index') },
    ];
    const category = filter.categories.find((c) => c.slug === filter.active) ?? null;
    const title =
        posts.current_page > 1
            ? t('blog.title_page', { page: posts.current_page })
            : category
              ? t('blog.seo_title_category', { category: category.name })
              : t('blog.seo_title');
    const showFeatured = posts.current_page === 1 && featured !== null;
    const gridPosts = showFeatured ? posts.data.filter((p) => p.id !== featured.id) : posts.data;
    const listed = showFeatured && featured && !posts.data.some((p) => p.id === featured.id) ? [featured, ...posts.data] : posts.data;

    // Tab / page change: dim the grid while Inertia fetches, then announce the result to screen readers.
    // Prefetches (hovering any <Link prefetch>) fire the same global events: ignored, or the grid would flash on hover.
    const [loading, setLoading] = useState(false);
    // The staggered fade-in only plays after a visit (tab / page change), not on the initial render.
    const [visited, setVisited] = useState(false);
    useEffect(() => {
        const offStart = router.on('start', (e) => {
            if (!e.detail.visit.prefetch) setLoading(true);
        });
        const offFinish = router.on('finish', (e) => {
            if (e.detail.visit.prefetch) return;
            setLoading(false);
            setVisited(true);
        });
        return () => {
            offStart();
            offFinish();
        };
    }, []);
    const status = category ? tc('blog.results_in', posts.total, { category: category.name }) : tc('blog.count', posts.total);
    const pageContext =
        posts.last_page > 1 && category
            ? `${t('blog.page_of', { current: posts.current_page, last: posts.last_page })} · ${category.name}`
            : undefined;

    return (
        <>
            <SeoHead
                title={title}
                description={category ? t('blog.seo_description_category', { category: category.name }) : t('blog.seo_description')}
                canonical={indexing.canonical}
                noindex={indexing.noindex}
                prev={indexing.prev}
                next={indexing.next}
                jsonLd={[
                    { '@type': 'CollectionPage', name: title, url: indexing.canonical },
                    breadcrumbList(crumbs, origin),
                    itemList(listed.map((p) => ({ name: p.title, url: p.url }))),
                ]}
            />
            <PublicLayout className="max-w-6xl">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <PageEyebrow>{t('blog.title')}</PageEyebrow>
                        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t('blog.headline')}</h1>
                    </div>
                    {/* GEO: the first paragraph answers the page's intent in one citable, factual sentence (brand + subject + place). */}
                    <p className="text-muted-foreground max-w-lg text-base/7 text-pretty sm:text-sm/6">
                        {category ? tc('blog.intro_category', category.count, { category: category.name }) : t('blog.intro')}
                    </p>
                </div>

                <div className="mt-12 flex flex-col gap-12 lg:mt-16 lg:gap-16">
                    {showFeatured && featured && <BlogFeaturedPost post={featured} />}
                    <div className="flex flex-col gap-6">
                        {filter.categories.length > 0 && <BlogCategoryFilter filter={filter} />}
                        <p role="status" aria-live="polite" className="sr-only">
                            {loading ? '' : status}
                        </p>
                        {gridPosts.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-10 text-center">
                                <p className="text-muted-foreground">
                                    {category ? t('blog.empty_category', { category: category.name }) : t('blog.empty')}
                                </p>
                                {category && (
                                    <Link
                                        href={filter.urls.all}
                                        preserveScroll
                                        preserveState
                                        className={cn('focus-ring text-sm font-medium', linkClass)}
                                    >
                                        {t('blog.view_all')}
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div
                                key={`${filter.active ?? 'all'}-${posts.current_page}`}
                                aria-busy={loading}
                                className={cn(
                                    'grid gap-6 transition-opacity duration-300 motion-reduce:transition-none sm:grid-cols-2 lg:grid-cols-3',
                                    loading && 'cursor-progress opacity-60',
                                )}
                            >
                                {gridPosts.map((post, i) => (
                                    /* Staggered fade-in on every tab / page change (the grid is re-keyed); the delay is the tolerated dynamic CSS variable. */
                                    <div
                                        key={post.id}
                                        style={{ '--stagger': `${Math.min(i, 8) * 60}ms` } as CSSProperties}
                                        className={cn(
                                            'flex',
                                            visited && 'animate-fade-in [animation-delay:var(--stagger)] motion-reduce:animate-none',
                                        )}
                                    >
                                        <BlogPostCard post={post} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 lg:mt-16">
                    <BlogPagination
                        current={posts.current_page}
                        last={posts.last_page}
                        prev={indexing.prev}
                        next={indexing.next}
                        context={pageContext}
                    />
                </div>
                {/* Same closing call to action as the home, About and Buy pages */}
                <div className="mx-auto mt-20 w-full max-w-5xl sm:mt-28">
                    <CtaCard />
                </div>
            </PublicLayout>
        </>
    );
}
