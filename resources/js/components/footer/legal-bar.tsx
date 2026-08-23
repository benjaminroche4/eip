import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

const LEGAL = [
    { key: 'privacy', href: '#' },
    { key: 'legal', href: '#' },
    { key: 'terms', href: '#' },
] as const;

/** Copyright + discreet legal links (12px, muted at 70 %), 60px bar under a gradient hairline (same as the header). */
export default function LegalBar({ year }: { year: number }) {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();

    return (
        <div className="before:via-border relative flex min-h-15 flex-col items-center justify-between gap-3 py-4 text-sm before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent sm:flex-row sm:py-0">
            <p className="text-foreground">{t('footer.copyright', { year, name: seo.siteName })}</p>
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
                {LEGAL.map((l) => (
                    <li key={l.key}>
                        <Link href={l.href} className="text-muted-foreground/70 focus-ring hover:text-foreground rounded-sm transition-colors">
                            {t(`footer.${l.key}`)}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
