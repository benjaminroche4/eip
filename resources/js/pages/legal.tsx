import SeoBreadcrumbs from '@/components/seo/seo-breadcrumbs';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { breadcrumbList } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type LegalProps = {
    page: { key: string; title: string; description: string; updated: string; sections: { heading: string; body: string }[] };
};

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
            <PublicLayout className="max-w-3xl">
                <SeoBreadcrumbs crumbs={crumbs} />
                <h1 className="mt-4 text-3xl font-semibold tracking-tight">{page.title}</h1>
                <p className="text-muted-foreground mt-2 text-sm">{page.updated}</p>
                <div className="mt-10 flex flex-col gap-8">
                    {page.sections.map((s) => (
                        <section key={s.heading}>
                            <h2 className="text-xl font-semibold">{s.heading}</h2>
                            <p className="text-muted-foreground mt-2 text-base/7 sm:text-sm/6">{s.body}</p>
                        </section>
                    ))}
                </div>
            </PublicLayout>
        </>
    );
}
