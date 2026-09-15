import { useTranslation } from '@/hooks/use-translation';
import { linkClass } from '@/lib/hover-surface';
import { type Crumb } from '@/lib/json-ld';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

/** Discreet breadcrumb (user decision 2026-09-15): `text-xs font-light`, muted at 60 %, current page at 80 % and truncated. */
export default function SeoBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
    const { t } = useTranslation();

    return (
        <nav aria-label={t('nav.breadcrumb')} className="text-muted-foreground/60 text-xs font-light">
            <ol className="flex flex-wrap items-center gap-1.5">
                {crumbs.map((c, i) => {
                    const last = i === crumbs.length - 1;
                    return (
                        <Fragment key={i}>
                            {i > 0 && <ChevronRight aria-hidden className="size-3 shrink-0" />}
                            <li aria-current={last ? 'page' : undefined} className={last ? 'text-muted-foreground/80 truncate' : undefined}>
                                {c.url && !last ? (
                                    <Link href={c.url} prefetch className={cn('focus-ring hover:text-foreground', linkClass)}>
                                        {c.name}
                                    </Link>
                                ) : (
                                    c.name
                                )}
                            </li>
                        </Fragment>
                    );
                })}
            </ol>
        </nav>
    );
}
