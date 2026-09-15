import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type BlogPaginationProps = {
    current: number;
    last: number;
    prev: string | null;
    next: string | null;
    /** Optional reminder under the row, e.g. « Page 2 / 4 · Acheter » when a category filter is active. */
    context?: string;
};

/** Pages to show: first, last, and a window around the current one; `null` marks a gap (…). */
export function pageItems(current: number, last: number): (number | null)[] {
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
    const pages = new Set([1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last));
    const sorted = [...pages].sort((a, b) => a - b);
    return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]));
}

type ArrowProps = { href: string | null; label: string; icon: typeof ChevronLeft };

/** Previous / next arrow: a link when there is a page, a disabled button otherwise (keeps the slot, no dead link). */
function Arrow({ href, label, icon: Icon }: ArrowProps) {
    if (!href) {
        return (
            <Button variant="outline" size="icon" disabled aria-label={label}>
                <Icon aria-hidden />
            </Button>
        );
    }
    return (
        <Button asChild variant="outline" size="icon">
            <Link href={href} aria-label={label}>
                <Icon aria-hidden />
            </Link>
        </Button>
    );
}

const pageUrl = (page: number) => (page > 1 ? route('blog.index', { page }) : route('blog.index'));

/** Previous / numbered pages / next, as crawlable links with `aria-current` on the active page. */
export default function BlogPagination({ current, last, prev, next, context }: BlogPaginationProps) {
    const { t } = useTranslation();
    if (last <= 1) return null;

    return (
        <nav className="flex flex-col items-center gap-3" aria-label={t('blog.pagination')}>
            <div className="flex flex-wrap items-center justify-center gap-2">
                <Arrow href={prev} label={t('blog.previous')} icon={ChevronLeft} />
                <ol role="list" className="flex items-center gap-1">
                    {pageItems(current, last).map((page, i) =>
                        page === null ? (
                            <li key={`gap-${i}`} aria-hidden className="text-muted-foreground px-1 text-sm">
                                …
                            </li>
                        ) : (
                            <li key={page}>
                                <Link
                                    href={pageUrl(page)}
                                    aria-current={page === current ? 'page' : undefined}
                                    aria-label={t('blog.go_to_page', { page })}
                                    className={cn(
                                        'focus-ring flex size-9 items-center justify-center text-sm tabular-nums transition-colors motion-reduce:transition-none',
                                        page === current ? 'bg-primary text-primary-foreground' : 'hover:bg-background-05 text-foreground',
                                    )}
                                >
                                    {page}
                                </Link>
                            </li>
                        ),
                    )}
                </ol>
                <Arrow href={next} label={t('blog.next')} icon={ChevronRight} />
            </div>
            {context && <p className="text-muted-foreground text-xs">{context}</p>}
        </nav>
    );
}
