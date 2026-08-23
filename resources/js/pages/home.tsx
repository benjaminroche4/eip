import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { siteGraph } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function Home() {
    const { seo, ziggy } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const origin = new URL(ziggy.location).origin;

    return (
        <>
            <SeoHead
                title={t('home.seo_title')}
                withSuffix={false}
                description={t('home.seo_description')}
                jsonLd={siteGraph(seo, origin, route('search'))}
            />
            <PublicLayout>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t('home.headline')}</h1>
                <p className="text-muted-foreground mt-4 max-w-2xl text-lg/8 sm:text-base/7">{t('home.intro')}</p>
            </PublicLayout>
        </>
    );
}
