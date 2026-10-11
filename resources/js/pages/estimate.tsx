import EstimateForm from '@/components/estimate/estimate-form';
import EstimateProcess from '@/components/estimate/estimate-process';
import CtaCard from '@/components/home/cta-card';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { breadcrumbList, serviceNode } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type EstimateProps = {
    propertyTypes: string[];
    contactMethods: string[];
    floors: string[];
    features: string[];
    conditions: string[];
    googleMapsKey: string | null;
};

/** Valuation page: eyebrow + h1 + answer-first intro, then the request form with its live recap (Figma 696-13105). */
export default function Estimate({ propertyTypes, contactMethods, floors, features, conditions, googleMapsKey }: EstimateProps) {
    const { t } = useTranslation();
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('pages.estimate.title'), url: route('estimate') },
    ];

    return (
        <>
            <SeoHead
                title={t('pages.estimate.seo_title')}
                description={t('pages.estimate.seo_description')}
                jsonLd={[
                    // The free valuation as a Service of the organisation (2026-09-22)
                    serviceNode(
                        {
                            name: t('pages.estimate.seo_title'),
                            description: t('pages.estimate.intro'),
                            url: route('estimate'),
                            serviceType: t('pages.estimate.title'),
                        },
                        origin,
                    ),
                    breadcrumbList(crumbs, origin),
                ]}
            />
            <PublicLayout>
                <div className="flex flex-col gap-12 lg:gap-16 lg:px-10">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <PageEyebrow>{t('pages.estimate.title')}</PageEyebrow>
                            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t('estimate.headline')}</h1>
                        </div>
                        <p className="text-muted-foreground max-w-2xl text-base/7 text-balance sm:text-sm/6">{t('pages.estimate.intro')}</p>
                    </div>
                    <EstimateForm
                        propertyTypes={propertyTypes}
                        contactMethods={contactMethods}
                        floors={floors}
                        features={features}
                        conditions={conditions}
                        googleMapsKey={googleMapsKey}
                    />
                    {/* How a valuation goes (GEO content under the form, user decision 2026-09-22) */}
                    {/* Column gap 48/64px + `mt-8 sm:mt-12` = the section rhythm of the closing card and the Buy / Sell pages (80/112px); the short gap alone is for header → form (user decision 2026-10-11) */}
                    <div className="mt-8 sm:mt-12">
                        <EstimateProcess />
                    </div>
                </div>
                {/* Same closing call to action as the home, About and Buy pages */}
                <div className="mx-auto mt-20 w-full max-w-5xl sm:mt-28">
                    <CtaCard />
                </div>
            </PublicLayout>
        </>
    );
}
