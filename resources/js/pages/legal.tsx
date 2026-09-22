import LegalBody from '@/components/legal/legal-body';
import LegalToc from '@/components/legal/legal-toc';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { breadcrumbList } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';

type LegalProps = {
    page: { key: string; title: string; description: string; updated: string; sections: { heading: string; body: string }[] };
};

/**
 * Legal document (privacy / legal / terms): the site's page header (eyebrow + h1 + intro), then the same
 * layout as the FAQ (same width, same menu): a table of contents in the FAQ-column style — sticky column on
 * desktop, bordered "contents" dropdown on mobile, scrollspy — and the sections split by gradient hairlines.
 */
export default function Legal({ page }: LegalProps) {
    const { ziggy } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: page.title, url: route(page.key) },
    ];

    return (
        <>
            <SeoHead title={page.title} description={page.description} jsonLd={breadcrumbList(crumbs, origin)} />
            <PublicLayout>
                <div className="flex flex-col gap-12 lg:gap-16 lg:px-10">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <PageEyebrow>{t('legal_pages.eyebrow')}</PageEyebrow>
                            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{page.title}</h1>
                        </div>
                        {/* No intro paragraph (user decision 2026-08-31): the description only feeds the meta; the date sits in a white square chip with the sand hairline (user decision 2026-09-22, replaces the grey pill) */}
                        <p className="border-secondary-30 bg-card text-text-heading flex items-center gap-2 border px-3 py-1.5 text-xs font-medium">
                            <CalendarDays aria-hidden className="text-muted-foreground size-3.5" strokeWidth={1.5} />
                            {page.updated}
                        </p>
                    </div>
                    <div className="flex flex-col gap-7 lg:flex-row lg:gap-16">
                        <LegalToc headings={page.sections.map((section) => section.heading)} />
                        <div className="flex min-w-0 flex-1 flex-col gap-8">
                            {/* No divider between sections (user decision 2026-09-15): whitespace alone separates them. */}
                            {page.sections.map((section, index) => (
                                <section key={section.heading} id={`legal-section-${index}`} className="flex scroll-mt-24 flex-col gap-2">
                                    {/* Sand Montserrat number before the title, like the About values (ui.sh variant « Numéro sable » chosen among 10, user decision 2026-09-22) */}
                                    <h2 className="flex items-baseline gap-3 text-xl font-medium">
                                        <span aria-hidden className="font-heading text-secondary-50 text-2xl font-semibold tabular-nums">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        {section.heading}
                                    </h2>
                                    <LegalBody body={section.body} />
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            </PublicLayout>
        </>
    );
}
