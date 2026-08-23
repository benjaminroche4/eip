import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

const LEGAL = ['privacy', 'legal', 'terms'] as const;

/** Copyright + discreet legal links (12px, muted — AA contrast), in their own nav landmark, 60px bar under a gradient hairline (same as the header). */
export default function LegalBar({ year }: { year: number }) {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();

    return (
        <div className="before:via-border relative flex min-h-15 flex-col items-start justify-between gap-4 py-5 text-sm before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent sm:flex-row sm:items-center sm:py-0">
            <nav aria-label={t('footer.legal_nav')}>
                <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                    {LEGAL.map((key) => (
                        <li key={key}>
                            <Link
                                href={route(key)}
                                prefetch
                                className="text-muted-foreground focus-ring hover:text-foreground rounded-sm transition-colors duration-300"
                            >
                                {t(`footer.${key}`)}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <p className="text-foreground">{t('footer.copyright', { year, name: seo.siteName })}</p>
        </div>
    );
}
