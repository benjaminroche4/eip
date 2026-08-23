import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Fragment } from 'react';

type LanguageLinksProps = { className?: string };

/** Inline "EN | FR" links to the current page in each locale (Figma 137-3968): Inter medium 12 spaced caps, inactive at 50 %. */
export default function LanguageLinks({ className }: LanguageLinksProps) {
    const { localization } = usePage<SharedData>().props;
    const { t } = useTranslation();

    return (
        <nav aria-label={t('nav.language')} className={cn('flex items-center text-xs font-medium tracking-widest uppercase', className)}>
            {localization.locales.map((l, i) => (
                <Fragment key={l.code}>
                    {i > 0 && <span aria-hidden className="bg-border h-3 w-px" />}
                    <a
                        href={l.url}
                        hrefLang={l.code}
                        lang={l.code}
                        aria-current={l.current ? 'page' : undefined}
                        className={cn(
                            'focus-ring rounded-sm px-4 py-3 transition-opacity',
                            l.current ? 'text-foreground' : 'text-muted-foreground opacity-50 hover:opacity-100',
                        )}
                    >
                        {l.code}
                    </a>
                </Fragment>
            ))}
        </nav>
    );
}
