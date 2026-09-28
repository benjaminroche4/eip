import CountBadge from '@/components/navigation/count-badge';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';

export type DistrictLink = { n: number; slug: string; url: string; name: string; count: number };

type DistrictLinksProps = { districts: DistrictLink[]; current: number | null };

/**
 * « Nos biens par arrondissement » under the grid: real, crawlable links to the clean district pages (2026-09-28),
 * one per arrondissement with listings, the current page marked `aria-current`. Style = the sitemap page's editorial
 * rows (ui.sh variant « Rangées éditoriales » chosen among 9, user decision 2026-09-28): full-width rows separated by
 * hairlines, the name left, the round sand count badge and an arrow right, sand background contained in the row on hover and on the current page (no weight change, the site's nav rule).
 */
export default function DistrictLinks({ districts, current }: DistrictLinksProps) {
    const { t } = useTranslation();
    const active = (d: DistrictLink) => current === d.n;
    const label = (d: DistrictLink) => t('properties.by_district_link', { name: d.name, count: d.count });

    return (
        <nav aria-label={t('properties.by_district')} className="border-border flex flex-col gap-4 border-t pt-6">
            <h3 className="text-base font-medium">{t('properties.by_district')}</h3>
            <ul role="list" className="divide-border divide-y">
                {districts.map((d) => (
                    <li key={d.n}>
                        <Link
                            href={d.url}
                            prefetch
                            aria-current={active(d) ? 'page' : undefined}
                            aria-label={label(d)}
                            className={cn(
                                'group focus-ring flex items-center justify-between gap-4 px-3 py-2.5 text-sm transition-colors duration-300 motion-reduce:transition-none',
                                active(d) ? 'bg-background-05' : 'hover:bg-background-05',
                            )}
                        >
                            <span>{d.name}</span>
                            <span className="flex items-center gap-3">
                                <CountBadge count={d.count} />
                                <ArrowUpRight
                                    aria-hidden
                                    className="text-muted-foreground group-hover:text-foreground size-4 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                                />
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
