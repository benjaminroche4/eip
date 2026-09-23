import DistrictDetail from '@/components/districts/district-detail';
import ParisMap, { type District } from '@/components/districts/paris-map';
import CtaCard from '@/components/home/cta-card';
import ServiceHero from '@/components/page/service-hero';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { breadcrumbList, itemList } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';

type DistrictsProps = { items: District[] };

/**
 * « Les arrondissements de Paris » (2026-09-22, restructured the same day on user request): the service hero shared with
 * « Vendre » / « Acheter » (`ServiceHero`, user decision 2026-09-23), the 3D map in the hero's panel slot (hover lights, click / tap / keyboard selects), the map hint, then the selected
 * arrondissement's detail panel under the map (strengths, who it suits, housing types, price, profile — all 20 in
 * the HTML, one shown), the Notaires source line and the CTA card. JSON-LD: breadcrumb + ItemList of the 20
 * arrondissements (anchors on the panels).
 */
export default function Districts({ items }: DistrictsProps) {
    const { t } = useTranslation();
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const [selected, setSelected] = useState<number | null>(null);
    const url = route('districts');
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('pages.districts.title'), url },
    ];

    return (
        <>
            <SeoHead
                title={t('pages.districts.seo_title')}
                description={t('pages.districts.seo_description')}
                jsonLd={[
                    breadcrumbList(crumbs, origin),
                    itemList(items.map((d) => ({ name: `${d.name} · ${d.areas}`, url: `${url}#arrondissement-${d.n}` }))),
                ]}
            />
            <PublicLayout className="flex max-w-7xl flex-col gap-20 sm:gap-28">
                {/* Same header as « Vendre » / « Acheter » (user decision 2026-09-23): the shared ServiceHero — eyebrow + h1 left, intro +
                    button right, wide photo with the key figures (contact is the action: no valuation pitch on a discovery page) */}
                {/* Same header as « Vendre » / « Acheter » (user decision 2026-09-23): the shared ServiceHero — eyebrow + h1 left, intro +
                    button right — with the 3D map in place of the photo panel (user decision 2026-09-23) */}
                <ServiceHero
                    id="districts-title"
                    href={route('contact')}
                    panel={
                        <div className="flex flex-col gap-4">
                            <ParisMap items={items} selected={selected} onSelect={setSelected} className="max-w-none" />
                            <p className="text-muted-foreground text-center text-xs">{t('districts.hint')}</p>
                        </div>
                    }
                    texts={{
                        eyebrow: t('districts.eyebrow'),
                        headline: t('districts.headline'),
                        intro: t('pages.districts.intro'),
                        cta: t('districts.hero_cta'),
                        photo_alt: '',
                        video_title: '',
                        play_video: '',
                        stats_label: '',
                    }}
                />

                <section aria-label={t('districts.detail_title')} className="flex flex-col gap-10">
                    {/* The selected arrondissement's profile, under the hero map (all 20 in the HTML, one shown) */}
                    <DistrictDetail items={items} selected={selected} className="max-w-none" />
                    <p className="text-muted-foreground text-xs text-pretty">{t('districts.source')}</p>
                </section>

                <div className="mx-auto mt-8 w-full max-w-5xl sm:mt-12">
                    <CtaCard />
                </div>
            </PublicLayout>
        </>
    );
}
