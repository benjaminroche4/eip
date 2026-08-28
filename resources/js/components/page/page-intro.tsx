import SeoBreadcrumbs from '@/components/seo/seo-breadcrumbs';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import { breadcrumbList } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type PageIntroProps = {
    /** Key under `ui.pages.*` — also the route name (contact, estimate, sell, buy). */
    page: 'contact' | 'estimate' | 'sell' | 'buy';
};

/** Head + breadcrumb + <h1> + answer-first paragraph of a service page (texts in lang/{locale}/ui.php `pages.<key>`). */
export default function PageIntro({ page }: PageIntroProps) {
    const { t } = useTranslation();
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t(`pages.${page}.title`), url: route(page) },
    ];

    return (
        <>
            <SeoHead title={t(`pages.${page}.seo_title`)} description={t(`pages.${page}.seo_description`)} jsonLd={breadcrumbList(crumbs, origin)} />
            <SeoBreadcrumbs crumbs={crumbs} />
            <h1 className="mt-4 text-3xl font-medium tracking-tight">{t(`pages.${page}.title`)}</h1>
            <p className="mt-4 max-w-3xl text-base/7 text-pretty">{t(`pages.${page}.intro`)}</p>
        </>
    );
}
