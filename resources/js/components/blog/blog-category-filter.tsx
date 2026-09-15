import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type BlogFilter } from './types';

type BlogCategoryFilterProps = { filter: BlogFilter };

const tabClass =
    'focus-ring focus-visible:ring-inset flex shrink-0 snap-start items-center gap-2 px-5 py-3 text-xs tracking-wider uppercase whitespace-nowrap transition-colors motion-reduce:transition-none';

/** SSR-safe layout effect (no warning on the server). */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Category tabs between the featured post and the grid (Figma 712-19437): uppercase labels on one hairline, each with its
 * article count in a badge. Plain links (`?category=`, server-side filter) marked `aria-current`. A single underline slides
 * from the current tab to the clicked one (optimistic, before the server answers), positioned through CSS variables.
 * On mobile the row scrolls horizontally (snap, hidden scrollbar, fades only where it continues) and the active tab is brought into view.
 */
export default function BlogCategoryFilter({ filter }: BlogCategoryFilterProps) {
    const { t, tc } = useTranslation();
    const list = useRef<HTMLUListElement>(null);
    // Optimistic active tab: moves on click, then follows the server's answer.
    const [current, setCurrent] = useState(filter.active);
    useEffect(() => setCurrent(filter.active), [filter.active]);
    const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);

    useIsomorphicLayoutEffect(() => {
        const measure = () => {
            const tab = list.current?.querySelector<HTMLElement>('[data-active="true"]');
            setIndicator(tab ? { x: tab.offsetLeft, w: tab.offsetWidth } : null);
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [current, filter.categories.length]);

    useEffect(() => {
        list.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
    }, [filter.active]);

    // Mobile fades: only where the strip actually continues (left once scrolled, right until the end).
    const [fade, setFade] = useState({ left: false, right: false });
    useEffect(() => {
        const el = list.current;
        if (!el) return;
        const update = () => setFade({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
        update();
        el.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            el.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [filter.categories.length]);

    const tab = (slug: string | null, name: string, count: number) => {
        const isActive = current === slug;
        return (
            <li key={slug ?? 'all'}>
                <Link
                    href={filter.urls[slug ?? 'all']}
                    preserveScroll
                    preserveState // same page component kept mounted: the underline can slide instead of jumping
                    onClick={() => setCurrent(slug)}
                    data-active={isActive}
                    aria-current={filter.active === slug ? 'page' : undefined}
                    className={cn(tabClass, isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                    {name}
                    <span
                        className={cn(
                            'rounded-full px-1.5 py-0.5 text-xs normal-case tabular-nums transition-colors motion-reduce:transition-none',
                            isActive ? 'bg-primary text-primary-foreground' : 'bg-background-08 text-muted-foreground',
                        )}
                    >
                        <span className="sr-only">{tc('blog.filter_count', count)}</span>
                        <span aria-hidden>{count}</span>
                    </span>
                </Link>
            </li>
        );
    };

    return (
        <nav aria-label={t('blog.filter_label')} className="relative">
            {fade.left && (
                <span
                    aria-hidden
                    className="from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r to-transparent sm:hidden"
                />
            )}
            {fade.right && (
                <span
                    aria-hidden
                    className="from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l to-transparent sm:hidden"
                />
            )}
            <ul
                ref={list}
                role="list"
                className="border-border relative flex snap-x snap-mandatory overflow-x-auto border-b [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
            >
                {tab(null, t('blog.all_categories'), filter.total_all)}
                {filter.categories.map((c) => tab(c.slug, c.name, c.count))}
                {indicator && (
                    /* Sliding underline: position and width come from the measured active tab (CSS variables, the tolerated dynamic style). */
                    <li
                        aria-hidden
                        data-testid="tab-indicator"
                        style={{ '--indicator-x': `${indicator.x}px`, '--indicator-w': `${indicator.w}px` } as CSSProperties}
                        className="bg-primary pointer-events-none absolute bottom-0 left-0 h-px w-(--indicator-w) translate-x-(--indicator-x) transition-[transform,width] duration-300 ease-out motion-reduce:transition-none"
                    />
                )}
            </ul>
        </nav>
    );
}
