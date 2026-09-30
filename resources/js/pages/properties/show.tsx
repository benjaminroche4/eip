import EnergyLabels from '@/components/properties/energy-labels';
import { FEATURE_ICONS } from '@/components/properties/more-filters';
import PropertiesMap, { type MapConfig } from '@/components/properties/properties-map';
import PropertyAdvisorCard, { type Advisor } from '@/components/properties/property-advisor-card';
import PropertyCard, { type Property } from '@/components/properties/property-card';
import PropertyDescription from '@/components/properties/property-description';
import PropertyDetails from '@/components/properties/property-details';
import PropertyGallery from '@/components/properties/property-gallery';
import PropertyHeader from '@/components/properties/property-header';
import PropertyMobileBar from '@/components/properties/property-mobile-bar';
import PropertyNeighbourhood from '@/components/properties/property-neighbourhood';
import SeoBreadcrumbs from '@/components/seo/seo-breadcrumbs';
import SeoHead from '@/components/seo/seo-head';
import { Button } from '@/components/ui/button';
import { LARGE_SCREEN, useMediaQuery } from '@/hooks/use-media-query';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { formatPrice } from '@/lib/format-price';
import { linkClass } from '@/lib/hover-surface';
import { breadcrumbList, realEstateListings } from '@/lib/json-ld';
import { ordinal } from '@/lib/ordinal';
import { propertyUrl } from '@/lib/property-url';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Info, MapPin } from 'lucide-react';
import { useRef, useState } from 'react';

type District = {
    n: number;
    name: string;
    areas: string;
    url: string;
    profileUrl: string;
    price: string | null;
    /** From the arrondissement profile (2026-09-28): lines, schools, parks. */
    metro: string[];
    rer: string[];
    education: string[];
    parks: string[];
};
type Neighbour = { title: string; url: string } | null;
type PropertyShowProps = {
    property: Property;
    similar: Property[];
    district: District;
    advisor: Advisor;
    /** Page meta (`meta`, not `seo`: that name is the shared prop). */
    meta: { title: string; withSuffix: boolean; description: string };
    map: MapConfig;
    /** Four questions of the matching FAQ topic (GEO, 2026-09-28). */
    /** Previous / next catalogue listing of the same transaction. */
    neighbours: { previous: Neighbour; next: Neighbour };
};

/**
 * Detail page of a listing (`/nos-biens/{slug}`, 2026-09-28, redesign the same day): visible breadcrumb (three
 * levels), the **photo mosaic first, full width** (lightbox), then two columns from `lg`: on the left the header
 * (`PropertyHeader`: eyebrow « Achat · Paris 6e · Saint-Germain-des-Prés », h1, GEO answer, reference, facts as icon tiles),
 * « Le bien » (description), « Les atouts » (feature tiles with the filters' icons), « Le quartier » (sentence, the
 * listing's price per m² against the arrondissement's average, links to the district listing and the arrondissement
 * profile, the Google map centred on the building); on the right the sticky advisor card (price, availability, the
 * advisor by name, contact prefilled with the listing, phone), replaced under lg by a bar fixed to the screen bottom
 * that opens the card in a sheet. Below, up to six similar listings as a row of marketplace cards, previous / next (the alert form was removed on user decision 2026-09-29),
 * then the FAQ and the CTA card. 2026-09-28 additions: real description and
 * rooms, energy labels, transport and district facts, folded map, sold banner (noindex), price history and the
 * viewing request in the card (the mortgage estimate was removed on user decision 2026-09-29).
 * Under the map, the mandatory notices of a French listing (fees, surface, diagnostics, Géorisques). Before the CTA, four
 * FAQ questions of the matching topic. JSON-LD: breadcrumb + the standalone `RealEstateListing` (`datePosted`) +
 * `FAQPage`; meta built from the data (`PropertySeo`); hreflang from the server (`LocalizedUrls::override`).
 */
export default function PropertyShow({ property, similar, district, advisor, meta, map, neighbours }: PropertyShowProps) {
    const { t, locale } = useTranslation();
    const { ziggy, seo } = usePage<SharedData>().props;
    const sold = Boolean(property.sold_at);
    // The Google map is folded behind a button under lg (2026-09-28): no API call for nothing on mobile
    const [mapOpen, setMapOpen] = useState(false);
    const desktop = useMediaQuery(LARGE_SCREEN);
    // Where the mobile bar stops: the similar listings, or the closing block when there are none
    const similarRef = useRef<HTMLElement>(null);
    const closing = useRef<HTMLDivElement>(null);
    // Section titles of the column (premium rework 2026-09-29): sand Montserrat number + title, as the legal pages
    let sectionNumber = 0;
    const sectionTitle = (id: string, label: string) => {
        sectionNumber += 1;
        return (
            <h2 id={id} className="flex items-baseline gap-3 text-xl font-medium tracking-tight">
                <span aria-hidden className="font-heading text-secondary-50 text-lg font-semibold tabular-nums sm:text-2xl">
                    {String(sectionNumber).padStart(2, '0')}
                </span>
                {label}
            </h2>
        );
    };
    const origin = new URL(ziggy.location).origin;
    const url = propertyUrl(property, locale);
    const arrondissement = `Paris ${ordinal(property.arrondissement, locale)}`;
    const reference = `${property.slug.slice(0, 2).toUpperCase()}-${property.arrondissement}`;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('pages.properties.title'), url: route('properties') },
        { name: district.name, url: district.url },
        { name: property.title },
    ];
    // GEO answer-first: one factual sentence, citable on its own (brand + type + facts + place + price), distinct from the excerpt
    const answer = t(property.transaction === 'rent' ? 'property.answer_rent' : 'property.answer', {
        type: t(`properties.types.${property.type}`).toLocaleLowerCase(locale),
        rooms: property.rooms,
        surface: property.surface,
        bedrooms: property.bedrooms,
        area: property.area,
        arrondissement,
        price: formatPrice(property.price, locale),
    });

    return (
        <>
            <Head>
                {/* The hero photo is the LCP: preloaded at the widths the browser will pick (2026-09-28) */}
                <link
                    rel="preload"
                    as="image"
                    href={property.photos[0].replace('{w}', '1600')}
                    imageSrcSet={[400, 800, 1200, 1600].map((w) => `${property.photos[0].replace('{w}', String(w))} ${w}w`).join(', ')}
                    imageSizes="100vw"
                    fetchPriority="high"
                />
            </Head>
            <SeoHead
                noindex={sold}
                title={meta.title}
                withSuffix={meta.withSuffix}
                description={meta.description}
                image={`${origin}${property.photos[0].replace('{w}', '1600')}`}
                imageAlt={property.photo_alt}
                jsonLd={[
                    breadcrumbList(crumbs, origin),
                    ...realEstateListings([property], origin, url, locale, true, { name: seo.organization.name, url: origin }),
                ]}
            />
            <PublicLayout className="flex max-w-7xl flex-col gap-16 sm:gap-20" backdrop={false}>
                <article className="flex flex-col gap-6 sm:gap-8">
                    {/* The photos first, full bleed under the header (the breadcrumb sits at the very end of the page) — redesign 2026-09-28 */}
                    <PropertyGallery photos={property.photos} alt={property.photo_alt} title={property.title} />
                    {/* The body rises over the bottom of the photo strip on a white surface, a notch cut into the photos (user
                        decision 2026-09-29): container-wide from lg (photos show on both sides), edge to edge under */}
                    <div className="bg-card relative z-10 -mx-6 -mt-12 flex flex-col gap-6 px-6 pt-6 sm:-mt-16 sm:gap-8 sm:pt-8 lg:mx-0 lg:-mt-20 lg:px-8 lg:pt-10">
                        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-16">
                            <div className="flex min-w-0 flex-col gap-14 sm:gap-16">
                                <PropertyHeader
                                    property={property}
                                    eyebrow={t('property.eyebrow', {
                                        transaction: t(`properties.transaction.${property.transaction}`),
                                        arrondissement,
                                        area: property.area,
                                    })}
                                    answer={answer}
                                />

                                <section aria-labelledby="property-description" className="flex max-w-prose flex-col gap-5">
                                    {sectionTitle('property-description', t('property.description_title'))}
                                    <PropertyDescription property={property} />
                                </section>

                                {property.rooms_detail && property.rooms_detail.length > 0 && (
                                    <section aria-labelledby="property-details" className="flex flex-col gap-6">
                                        {sectionTitle('property-details', t('property.details_title'))}
                                        <PropertyDetails property={property} />
                                    </section>
                                )}

                                {property.features && property.features.length > 0 && (
                                    <section aria-labelledby="property-features" className="flex flex-col gap-6">
                                        {sectionTitle('property-features', t('property.features_title'))}
                                        {/* The filters' icons, in the site's square sand tiles */}
                                        <ul role="list" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                            {property.features.map((feature) => {
                                                const Icon = FEATURE_ICONS[feature as keyof typeof FEATURE_ICONS];
                                                return (
                                                    <li key={feature} className="flex items-center gap-3 text-sm">
                                                        <span
                                                            aria-hidden
                                                            className="bg-background-05 flex size-10 shrink-0 items-center justify-center"
                                                        >
                                                            {Icon && <Icon className="size-4" strokeWidth={1.5} />}
                                                        </span>
                                                        {t(`properties.feature.${feature}`)}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </section>
                                )}

                                {property.dpe && (
                                    <section aria-labelledby="property-energy" className="flex flex-col gap-6">
                                        {sectionTitle('property-energy', t('property.energy_title'))}
                                        <EnergyLabels property={property} />
                                    </section>
                                )}

                                <section aria-labelledby="property-location" className="flex flex-col gap-8">
                                    {sectionTitle('property-location', t('property.location_title'))}
                                    {/* Prices read against the arrondissement, stations, schools and parks — `property-neighbourhood.tsx` (rework 2026-09-29) */}
                                    <PropertyNeighbourhood property={property} district={district} arrondissement={arrondissement} />
                                    <p className="text-grey-60 flex gap-2 text-xs text-pretty">
                                        <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.5} />
                                        <span>{t('property.location_text', { area: property.area, arrondissement })}</span>
                                    </p>
                                    {mapOpen || desktop ? (
                                        <PropertiesMap
                                            properties={[property]}
                                            active={null}
                                            onActivate={() => {}}
                                            onSelect={() => {}}
                                            config={map}
                                            fitKey={property.slug}
                                            className="h-72 sm:h-96"
                                        />
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="lg"
                                            onClick={() => setMapOpen(true)}
                                            className="w-fit"
                                            aria-expanded={false}
                                        >
                                            <MapPin aria-hidden strokeWidth={1.5} />
                                            {t('property.show_map')}
                                        </Button>
                                    )}
                                </section>

                                {/* Mandatory notices of a French listing (2026-09-28): fees, surface, diagnostics on viewing, the Géorisques line */}
                                <section aria-labelledby="property-legal" className="text-grey-60 flex gap-2 text-xs text-pretty">
                                    <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.5} />
                                    <div className="flex flex-col gap-1">
                                        <h2 id="property-legal" className="sr-only">
                                            {t('property.legal_title')}
                                        </h2>
                                        {/* The reference, discreet, with the notices (user decision 2026-09-30) */}
                                        <p>{t('property.reference', { reference })}</p>
                                        <p>{t(property.transaction === 'rent' ? 'property.legal_rent' : 'property.legal_sale')}</p>
                                        <p>
                                            {t('property.legal_risks')}{' '}
                                            <a href="https://www.georisques.gouv.fr" rel="noopener" target="_blank" className={linkClass}>
                                                {t('property.legal_risks_link')}
                                            </a>
                                        </p>
                                    </div>
                                </section>
                            </div>

                            {/* Desktop only, sticky 32px under the compact header (64px + gap, it sat behind the bar at top-14); under lg the bottom bar carries the card in a sheet (2026-09-29) */}
                            <div id="property-advisor" className="hidden scroll-mt-28 lg:sticky lg:top-24 lg:block">
                                <PropertyAdvisorCard property={property} advisor={advisor} reference={reference} />
                            </div>
                        </div>
                    </div>
                </article>

                {similar.length > 0 && (
                    <section ref={similarRef} aria-labelledby="property-similar" className="flex flex-col gap-8">
                        <div className="flex flex-col gap-4">
                            <h2 id="property-similar" className="text-2xl font-medium tracking-tight">
                                {t('property.similar_title')}
                            </h2>
                            <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{t('property.similar_intro')}</p>
                        </div>
                        {/* A row that scrolls and snaps (up to six, 2026-09-28), the cards at the grid's width */}
                        <ul
                            role="list"
                            className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
                        >
                            {similar.map((item) => (
                                <li
                                    key={item.slug}
                                    className="flex w-[82vw] shrink-0 snap-start last:snap-end sm:w-[46vw] lg:w-[calc((100%-2rem)/3)]"
                                >
                                    <PropertyCard property={item} />
                                </li>
                            ))}
                        </ul>
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Previous / next listing of the same transaction as two buttons (user decision 2026-09-29) */}
                            <nav aria-label={t('property.neighbours_label')} className="flex flex-wrap gap-3">
                                {neighbours.previous && (
                                    <Button asChild variant="outline" size="lg">
                                        <Link
                                            href={neighbours.previous.url}
                                            prefetch
                                            aria-label={`${t('property.previous')} : ${neighbours.previous.title}`}
                                        >
                                            <ArrowLeft aria-hidden />
                                            {t('property.previous')}
                                        </Link>
                                    </Button>
                                )}
                                {neighbours.next && (
                                    <Button asChild variant="outline" size="lg">
                                        <Link href={neighbours.next.url} prefetch aria-label={`${t('property.next')} : ${neighbours.next.title}`}>
                                            {t('property.next')}
                                            <ArrowRight aria-hidden />
                                        </Link>
                                    </Button>
                                )}
                            </nav>
                        </div>
                    </section>
                )}

                {/* The way back and the breadcrumb close the page as one block (mobile spacing review 2026-09-30) */}
                <div ref={closing} className="flex flex-col gap-4">
                    <Button asChild variant="outline" size="lg" className="w-full lg:hidden">
                        <Link href={route('properties')} prefetch>
                            <ArrowLeft aria-hidden />
                            {t('property.back_list')}
                        </Link>
                    </Button>
                    <SeoBreadcrumbs crumbs={crumbs} />
                </div>

                <PropertyMobileBar property={property} advisor={advisor} reference={reference} until={similar.length > 0 ? similarRef : closing} />
            </PublicLayout>
        </>
    );
}
