import GradientHairline from '@/components/layout/gradient-hairline';
import LegalToc from '@/components/legal/legal-toc';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { breadcrumbList } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { Fragment } from 'react';

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
                        {/* No intro paragraph (user decision 2026-08-31): the description only feeds the meta; the date sits in a bordered pill */}
                        <p className="border-border text-muted-foreground flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
                            <CalendarDays aria-hidden className="size-3.5" />
                            {page.updated}
                        </p>
                    </div>
                    <div className="flex flex-col gap-7 lg:flex-row lg:gap-16">
                        <LegalToc headings={page.sections.map((section) => section.heading)} />
                        <div className="flex min-w-0 flex-1 flex-col gap-8">
                            {page.sections.map((section, index) => (
                                <Fragment key={section.heading}>
                                    {index > 0 && <GradientHairline />}
                                    <section id={`legal-section-${index}`} className="flex scroll-mt-24 flex-col gap-2">
                                        <h2 className="text-lg font-medium">{section.heading}</h2>
                                        <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{section.body}</p>
                                    </section>
                                </Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </PublicLayout>
        </>
    );
}
