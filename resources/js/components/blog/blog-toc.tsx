import { useTranslation } from '@/hooks/use-translation';
import { type TocEntry } from '@/lib/blog-toc';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

type BlogTocProps = { entries: TocEntry[] };

/**
 * Article table of contents (left column on desktop, inside a sticky side card): one link per titled section, the section
 * currently in view marked `aria-current` (IntersectionObserver, client only — the SSR HTML has no active entry).
 */
export default function BlogToc({ entries }: BlogTocProps) {
    const { t } = useTranslation();
    const [active, setActive] = useState<string | null>(null);

    useEffect(() => {
        const targets = entries.map((e) => document.getElementById(e.id)).filter((el): el is HTMLElement => el !== null);
        if (targets.length === 0 || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(
            (records) => {
                const visible = records.filter((r) => r.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { rootMargin: '-96px 0px -60% 0px' },
        );
        targets.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [entries]);

    // Long articles: the list is capped in height and scrolls, keeping the active entry in view.
    // Only the list's own scrollTop moves — never scrollIntoView, which also scrolls the window and, on mobile
    // (where the list sits above the body), yanked the page back up to the table of contents.
    useEffect(() => {
        if (!active) return;
        const link = document.querySelector<HTMLElement>(`a[href="#${active}"]`);
        const list = link?.closest<HTMLElement>('ol');
        if (!link || !list) return;
        const top = link.offsetTop - list.offsetTop;
        const bottom = top + link.offsetHeight;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
    }, [active]);

    if (entries.length === 0) return null;

    return (
        <nav aria-label={t('blog.toc')}>
            <p className="text-muted-foreground mb-4 text-xs font-medium tracking-wider uppercase">{t('blog.toc')}</p>
            <ol role="list" className="border-border flex max-h-72 flex-col overflow-y-auto border-l [scrollbar-width:thin]">
                {entries.map((entry) => {
                    const isActive = active === entry.id;
                    return (
                        <li key={entry.id} className="-ml-px">
                            <a
                                href={`#${entry.id}`}
                                aria-current={isActive ? 'location' : undefined}
                                className={cn(
                                    'focus-ring block border-l py-2 pr-3 pl-4 text-sm transition-colors motion-reduce:transition-none',
                                    isActive
                                        ? 'bg-background-08 border-primary text-foreground'
                                        : 'text-muted-foreground hover:bg-background-05 hover:text-foreground border-transparent',
                                )}
                            >
                                {entry.title}
                            </a>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
