import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUp } from 'lucide-react';

const LEGAL = ['privacy', 'legal', 'terms'] as const;

/** Copyright + discreet legal links (14px, muted — AA contrast) + back-to-top, in their own nav landmark, 60px bar under a gradient hairline (same as the header). */
export default function LegalBar({ year }: { year: number }) {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();

    return (
        <div className="before:via-border relative flex min-h-15 flex-col items-center justify-between gap-4 py-5 text-sm before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent sm:flex-row sm:py-0">
            <p className="text-foreground">{t('footer.copyright', { year, name: seo.siteName })}</p>
            <nav aria-label={t('footer.legal_nav')}>
                <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
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
            <a
                href="#main"
                className="text-muted-foreground focus-ring hover:text-foreground group inline-flex items-center gap-2 rounded-sm text-sm transition-colors duration-300"
            >
                {t('footer.back_to_top')}
                <ArrowUp
                    aria-hidden
                    strokeWidth={1.25}
                    className="size-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 motion-reduce:transition-none"
                />
            </a>
        </div>
    );
}
