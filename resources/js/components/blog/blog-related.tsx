import { useTranslation } from '@/hooks/use-translation';
import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import BlogPostCard from './blog-post-card';
import { type BlogPostSummary } from './types';

type BlogRelatedProps = { posts: BlogPostSummary[] };

/** « Nos derniers articles »: the three latest other articles (never the current one), listing cards; horizontal snap scroll on mobile. */
export default function BlogRelated({ posts }: BlogRelatedProps) {
    const { t } = useTranslation();
    const list = useRef<HTMLUListElement>(null);

    // No hover on touch screens: prefetch each card's article once it scrolls into view, so the tap is instant.
    useEffect(() => {
        const el = list.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(
            (records) => {
                for (const r of records) {
                    if (!r.isIntersecting) continue;
                    const url = (r.target as HTMLElement).dataset.url;
                    if (url) router.prefetch(url, { method: 'get' }, { cacheFor: 30_000 });
                    observer.unobserve(r.target);
                }
            },
            { rootMargin: '200px' },
        );
        el.querySelectorAll<HTMLElement>('[data-url]').forEach((li) => observer.observe(li));
        return () => observer.disconnect();
    }, [posts]);

    if (posts.length === 0) return null;

    return (
        <section aria-labelledby="related-posts-title" className="flex flex-col gap-6">
            <h2 id="related-posts-title" className="text-2xl font-medium tracking-tight">
                {t('blog.related')}
            </h2>
            {/* Mobile: one row that scrolls sideways (snap, hidden scrollbar, cards at 85 % of the viewport); `scroll-px-6` keeps the snapped card off the screen edge (snap-start otherwise aligns it to the padding box, ignoring `px-6`); grid from sm. */}
            <ul
                ref={list}
                role="list"
                className="-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden max-sm:[&>li]:w-[85vw] max-sm:[&>li]:shrink-0"
            >
                {posts.map((post) => (
                    <li key={post.id} data-url={post.url} className="flex snap-start">
                        <BlogPostCard post={post} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
