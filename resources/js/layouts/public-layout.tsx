import SiteFooter from '@/components/layout/site-footer';
import SiteHeader from '@/components/layout/site-header';
import PageBackdrop from '@/components/page/page-backdrop';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

type PublicLayoutProps = PropsWithChildren<{
    className?: string;
    /** Page opens with a full-width hero that runs behind the header (home). */
    hero?: boolean;
    /** Haussmann façade watermark behind the page header; off for pages opening on a photo (about). */
    backdrop?: boolean;
}>;

/** Layout of every public (SSR, indexable) page: header, <main> filling the viewport, footer pinned at the bottom. `overflow-x-clip` lets a `w-screen` breakout (about page testimonials) bleed without a horizontal scrollbar. */
export default function PublicLayout({ children, className, hero = false, backdrop = true }: PublicLayoutProps) {
    const { t } = useTranslation();
    const { year } = usePage<SharedData>().props;

    return (
        <div className="flex min-h-dvh flex-col overflow-x-clip">
            <a
                href="#main"
                className="focus-ring bg-primary text-primary-foreground sr-only z-50 rounded-none px-4 py-2 text-base focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
                {t('a11y.skip_to_content')}
            </a>
            <SiteHeader overlay={hero} />
            <main
                id="main"
                tabIndex={-1}
                className={cn(
                    'relative mx-auto w-full max-w-7xl flex-1 focus:outline-none',
                    hero ? 'max-w-none px-0 pt-0 pb-10' : 'px-6 py-16 sm:py-20 lg:px-8',
                    className,
                )}
            >
                {!hero && backdrop && <PageBackdrop />}
                {children}
            </main>
            <SiteFooter year={year} />
        </div>
    );
}
