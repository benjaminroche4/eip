import SiteFooter from '@/components/layout/site-footer';
import SiteHeader from '@/components/layout/site-header';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

type PublicLayoutProps = PropsWithChildren<{ className?: string }>;

/** Layout of every public (SSR, indexable) page: header, <main> filling the viewport, footer pinned at the bottom. */
export default function PublicLayout({ children, className }: PublicLayoutProps) {
    const { t } = useTranslation();
    const { year } = usePage<SharedData>().props;

    return (
        <div className="flex min-h-dvh flex-col">
            <a
                href="#main"
                className="focus-ring bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 text-base focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
                {t('a11y.skip_to_content')}
            </a>
            <SiteHeader />
            <main id="main" tabIndex={-1} className={cn('mx-auto w-full max-w-7xl flex-1 px-4 py-10 focus:outline-none sm:px-6 lg:px-8', className)}>
                {children}
            </main>
            <SiteFooter year={year} />
        </div>
    );
}
