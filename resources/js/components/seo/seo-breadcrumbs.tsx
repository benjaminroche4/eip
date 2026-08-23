import { useTranslation } from '@/hooks/use-translation';
import { type Crumb } from '@/lib/json-ld';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

export default function SeoBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
    const { t } = useTranslation();

    return (
        <nav aria-label={t('nav.breadcrumb')} className="text-muted-foreground text-base/7 sm:text-sm/6">
            <ol className="flex flex-wrap items-center gap-1.5">
                {crumbs.map((c, i) => {
                    const last = i === crumbs.length - 1;
                    return (
                        <Fragment key={i}>
                            {i > 0 && <ChevronRight aria-hidden className="size-4" />}
                            <li aria-current={last ? 'page' : undefined} className={last ? 'text-foreground' : undefined}>
                                {c.url && !last ? (
                                    <Link href={c.url} prefetch className="hover:text-foreground">
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
