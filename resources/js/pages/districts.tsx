import DistrictDetail from '@/components/districts/district-detail';
import DistrictPicker from '@/components/districts/district-picker';
import ParisMap, { type District } from '@/components/districts/paris-map';
import CtaCard from '@/components/home/cta-card';
import ServiceHero from '@/components/page/service-hero';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { scrollBehavior } from '@/lib/focus-field';
import { breadcrumbList, itemList } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

type DistrictsProps = {
    items: District[];
    /** Preselected from `?arrondissement=` / `?district=`, the 6e by default (DistrictsController). */ selected: number | null;
};

/**
 * « Les arrondissements de Paris » (2026-09-22, restructured the same day on user request): the service hero shared with
 * « Vendre » / « Acheter » (`ServiceHero`, user decision 2026-09-23), the 3D map in the hero's panel slot (hover lights, click / tap / keyboard selects), the map hint, then the selected
 * arrondissement's detail panel under the map (all 20 in the HTML, one shown), preceded by a text picker with
 * previous / next arrows (2026-09-25), then the CTA card. The selection lives in the URL (`?arrondissement=` /
 * `?district=`, read server-side for SSR and sharing) and the sheet scrolls into view when selected out of sight.
 * JSON-LD: breadcrumb + ItemList of the 20 arrondissements (anchors on the panels).
 */
export default function Districts({ items, selected: initial }: DistrictsProps) {
    const { t } = useTranslation();
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const [selected, setSelected] = useState<number | null>(initial);
    const url = route('districts');
    // Selection (map, picker, arrows) — 2026-09-25: the choice is written to the URL (`?arrondissement=14` in FR,
    // `?district=14` in EN, replaceState: no history entry per click) so the link can be copied, and the sheet is
    // brought into view when it sits out of the viewport (the map is in the hero, the profile below the fold).
    const param = t('districts.url_param');
    const scrollOnNext = useRef(false);
    const select = useCallback(
        (n: number | null) => {
            scrollOnNext.current = n !== null;
            setSelected(n);
            const next = new URL(window.location.href);
            ['arrondissement', 'district'].forEach((key) => next.searchParams.delete(key));
            if (n !== null) next.searchParams.set(param, String(n));
            window.history.replaceState(window.history.state, '', next);
        },
        [param],
    );
    useEffect(() => {
        if (!scrollOnNext.current || selected === null) return;
        scrollOnNext.current = false;
        const sheet = document.getElementById(`arrondissement-${selected}`);
        const block = document.getElementById('districts-profile'); // picker + sheet, `scroll-mt-24` keeps it under the header
        if (!sheet || !block) return;
        const { top, bottom } = sheet.getBoundingClientRect();
        // Aims at the block, not the sheet: the sheet alone landed too low, hiding the picker and the arrows (user feedback 2026-09-25)
        if (top > window.innerHeight * 0.8 || bottom < 0) block.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
    }, [selected]);
    // A shared anchor (`#arrondissement-14`, the JSON-LD ItemList urls) also preselects, once, at mount
    useEffect(() => {
        const match = /^#arrondissement-(\d{1,2})$/.exec(window.location.hash);
        const n = match ? Number(match[1]) : null;
        if (n !== null && n >= 1 && n <= 20 && !window.location.search) setSelected(n); // the default (6e) yields to a shared anchor
    }, []);
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
                    panel={<ParisMap items={items} selected={selected} onSelect={select} className="max-w-none" />}
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

                {/* Sand band under the picker and the profile (user decision 2026-09-25): the site's sand → white gradient in a
                    full-width breakout, as the advantages and the testimonials, with its own column and padding */}
                <section
                    id="districts-profile"
                    aria-label={t('districts.detail_title')}
                    className="from-background-05 to-background relative left-1/2 w-screen -translate-x-1/2 scroll-mt-24 bg-linear-to-b from-40%"
                >
                    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 sm:py-20 lg:px-8">
                        {/* Text alternative to the map + previous / next (2026-09-25), then the selected profile (all 20 in the HTML, one shown) */}
                        <DistrictPicker items={items} selected={selected} onSelect={select} />
                        <DistrictDetail items={items} selected={selected} className="max-w-none" />
                    </div>
                </section>

                {/* No extra margin: the sand band above already ends with its own padding (2026-09-25) */}
                <div className="mx-auto w-full max-w-5xl">
                    <CtaCard />
                </div>
            </PublicLayout>
        </>
    );
}
