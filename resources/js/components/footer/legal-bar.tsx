import { useTranslation } from '@/hooks/use-translation';
import { linkClass } from '@/lib/hover-surface';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

const LEGAL = ['privacy', 'legal', 'sitemap'] as const;

/** Copyright + discreet legal links (privacy, legal notice, sitemap — the terms page was dropped on 2026-09-22) (12px, muted — AA contrast), in their own nav landmark, 60px bar under a gradient hairline (same as the header). Centred on mobile (user decision 2026-09-22), one row from `sm`. */
export default function LegalBar({ year }: { year: number }) {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();

    return (
        <div className="before:via-border relative flex flex-col items-center justify-between gap-4 py-6 text-center text-sm before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent sm:flex-row sm:items-center sm:py-6 sm:text-left">
            <p className="text-foreground">{t('footer.copyright', { year, name: seo.siteName })}</p>
            <nav aria-label={t('footer.legal_nav')}>
                <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:justify-start">
                    {LEGAL.map((key) => (
                        <li key={key}>
                            <Link
                                href={route(key)}
                                prefetch
                                className={cn(
                                    'text-muted-foreground focus-ring hover:text-foreground rounded-none transition-colors duration-300',
                                    linkClass,
                                )}
                            >
                                {t(`footer.${key}`)}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}
