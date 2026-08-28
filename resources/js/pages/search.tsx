import SeoBreadcrumbs from '@/components/seo/seo-breadcrumbs';
import SeoHead from '@/components/seo/seo-head';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { linkClass } from '@/lib/hover-surface';
import { breadcrumbList } from '@/lib/json-ld';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Search as SearchIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Result = { id: number; title: string; excerpt: string; url: string };

type Props = {
    filters: { q: string };
    results: { data: Result[]; total: number; current_page: number; last_page: number };
    indexing: { noindex: boolean; prev: string | null; next: string | null };
};

export default function Search({ filters, results, indexing }: Props) {
    const [q, setQ] = useState(filters.q);
    const isFirstRender = useRef(true);

    // Debounced client-side refinement: partial reload of `results` only, URL kept shareable.
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(route('search'), q ? { q } : {}, { only: ['results', 'indexing'], preserveState: true, preserveScroll: true, replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [q]);

    const { t, tc } = useTranslation();
    const pageTitle = filters.q ? t('search.title_with_term', { term: filters.q }) : t('search.seo_title');
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('nav.search'), url: route('search') },
    ];

    return (
        <>
            <SeoHead
                title={pageTitle}
                description={t('search.seo_description')}
                canonical={route('search')}
                noindex={indexing.noindex}
                prev={indexing.prev}
                next={indexing.next}
                jsonLd={[{ '@type': 'SearchResultsPage', name: pageTitle }, breadcrumbList(crumbs, origin)]}
            />
            <PublicLayout className="max-w-3xl">
                <SeoBreadcrumbs crumbs={crumbs} />
                <h1 className="mt-4 text-3xl font-semibold tracking-tight">{t('search.title')}</h1>

                <form
                    role="search"
                    className="mt-6 flex gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                    }}
                >
                    <div className="relative flex-1">
                        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 sm:size-4" />
                        <Input
                            type="search"
                            name="q"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={t('search.placeholder')}
                            aria-label={t('search.label')}
                            className="h-11 pl-10 text-base sm:h-10 sm:text-sm"
                        />
                    </div>
                    <Button type="submit" className="h-11 sm:h-10">
                        {t('search.submit')}
                    </Button>
                </form>

                <p className="text-muted-foreground mt-4 text-base/7 sm:text-sm/6">{tc('search.results', results.total)}</p>

                <ul className="divide-border mt-6 divide-y">
                    {results.data.map((item) => (
                        <li key={item.id} className="py-4">
                            <Link href={item.url} className={cn('focus-ring text-lg font-medium sm:text-base', linkClass)}>
                                {item.title}
                            </Link>
                            <p className="text-muted-foreground mt-1 text-base/7 sm:text-sm/6">{item.excerpt}</p>
                        </li>
                    ))}
                    {results.data.length === 0 && <li className="text-muted-foreground py-10 text-center">{t('search.empty')}</li>}
                </ul>

                {results.last_page > 1 && (
                    <nav className="mt-8 flex items-center justify-between" aria-label="Pagination">
                        <Button asChild variant="outline" disabled={!indexing.prev}>
                            <Link href={indexing.prev ?? '#'} preserveScroll>
                                {t('search.previous')}
                            </Link>
                        </Button>
                        <span className="text-muted-foreground text-sm">
                            {t('search.page_of', { current: results.current_page, last: results.last_page })}
                        </span>
                        <Button asChild variant="outline" disabled={!indexing.next}>
                            <Link href={indexing.next ?? '#'} preserveScroll>
                                {t('search.next')}
                            </Link>
                        </Button>
                    </nav>
                )}
            </PublicLayout>
        </>
    );
}
