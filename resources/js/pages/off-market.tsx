import PageEyebrow from '@/components/page/page-eyebrow';
import PropertyCard, { type Property } from '@/components/properties/property-card';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';

type OffMarketProps = { properties: Property[] };

/**
 * « Biens off-market » (2026-09-28): the confidential selection, never indexed, **to be gated by an access code**
 * (user decision; the gate comes after the card design round). For now: header + the grid of off-market cards.
 */
export default function OffMarketPage({ properties }: OffMarketProps) {
    const { t, tc } = useTranslation();

    return (
        <>
            <SeoHead title={t('pages.off_market.seo_title')} description={t('pages.off_market.seo_description')} noindex />
            <PublicLayout className="max-w-7xl">
                <div className="flex flex-col gap-12">
                    <div className="flex max-w-2xl flex-col gap-4">
                        <PageEyebrow>{t('pages.off_market.title')}</PageEyebrow>
                        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t('off_market.headline')}</h1>
                        {/* GEO: a self-contained sentence */}
                        <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{t('pages.off_market.intro')}</p>
                        <p className="text-sm font-medium tabular-nums">{tc('off_market.count', properties.length, { count: properties.length })}</p>
                    </div>
                    <ul role="list" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {properties.map((property) => (
                            <li key={property.slug} className="flex">
                                <PropertyCard property={property} />
                            </li>
                        ))}
                    </ul>
                </div>
            </PublicLayout>
        </>
    );
}
