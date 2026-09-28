import CtaCard from '@/components/home/cta-card';
import GradientHairline from '@/components/layout/gradient-hairline';
import PropertiesMap, { type MapConfig } from '@/components/properties/properties-map';
import PropertyAdvisorCard from '@/components/properties/property-advisor-card';
import PropertyCard, { type Property } from '@/components/properties/property-card';
import PropertyFacts from '@/components/properties/property-facts';
import PropertyGallery from '@/components/properties/property-gallery';
import SeoBreadcrumbs from '@/components/seo/seo-breadcrumbs';
import SeoHead from '@/components/seo/seo-head';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { linkClass } from '@/lib/hover-surface';
import { breadcrumbList, realEstateListings } from '@/lib/json-ld';
import { ordinal } from '@/lib/ordinal';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react';

type District = { n: number; name: string; areas: string; url: string; profileUrl: string };
type PropertyShowProps = {
    property: Property;
    similar: Property[];
    district: District;
    advisor: { id: number; photo: string };
    seo: { title: string; withSuffix: boolean; description: string };
    map: MapConfig;
};

/**
 * Detail page of a listing (`/nos-biens/{slug}`, 2026-09-28): visible breadcrumb (three levels), eyebrow
 * « Achat · Paris 6e · Saint-Germain-des-Prés », the title as h1 with the reference and the publication date, then two
 * columns from `lg`: on the left the gallery, « En bref » (icon facts), « Le bien » (the description), « Les atouts »
 * (features as check chips), « Le quartier » (sentence, links to the district listing and the arrondissement profile,
 * the Google map centred on the building); on the right the sticky advisor card (price, availability, advisor, contact
 * prefilled with the listing, phone). Below, up to three similar listings as the marketplace cards, then the CTA card.
 * JSON-LD: breadcrumb + the `RealEstateListing`; hreflang from the server (`LocalizedUrls::override`).
 */
export default function PropertyShow({ property, similar, district, advisor, seo, map }: PropertyShowProps) {
    const { t, locale } = useTranslation();
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const url = `${route('properties')}/${property.slug}`;
    const arrondissement = `Paris ${ordinal(property.arrondissement, locale)}`;
    const reference = property.slug.slice(0, 2).toUpperCase();
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('pages.properties.title'), url: route('properties') },
        { name: district.name, url: district.url },
        { name: property.title },
    ];
    const published = property.published_at
        ? new Date(property.published_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <>
            <SeoHead
                title={seo.title}
                withSuffix={seo.withSuffix}
                description={seo.description}
                image={`${origin}${property.photos[0].replace('{w}', '1600')}`}
                imageAlt={property.photo_alt}
                jsonLd={[breadcrumbList(crumbs, origin), ...realEstateListings([property], origin, url, locale)]}
            />
            <PublicLayout className="flex max-w-7xl flex-col gap-16 sm:gap-20" backdrop={false}>
                <article className="flex flex-col gap-8">
                    {/* Header: breadcrumb (a page at depth ≥ 2), eyebrow, h1, reference + date */}
                    <header className="flex max-w-3xl flex-col gap-4">
                        <SeoBreadcrumbs crumbs={crumbs} />
                        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                            {t('property.eyebrow', {
                                transaction: t(`properties.transaction.${property.transaction}`),
                                arrondissement,
                                area: property.area,
                            })}
                        </p>
                        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{property.title}</h1>
                        {/* GEO: the excerpt answers first, one factual sentence about the listing */}
                        <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{property.excerpt}</p>
                        <p className="text-muted-foreground flex flex-wrap gap-x-3 text-xs tabular-nums">
                            <span>{t('property.reference', { reference: `${reference}-${property.arrondissement}` })}</span>
                            {published && <span>{t('property.published', { date: published })}</span>}
                        </p>
                    </header>

                    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-16">
                        <div className="flex min-w-0 flex-col gap-10">
                            <PropertyGallery photos={property.photos} alt={property.photo_alt} title={property.title} />

                            <section aria-labelledby="property-facts" className="flex flex-col gap-4">
                                <h2 id="property-facts" className="text-2xl font-medium tracking-tight">
                                    {t('property.facts_title')}
                                </h2>
                                <PropertyFacts property={property} />
                            </section>

                            <GradientHairline />

                            <section aria-labelledby="property-description" className="flex max-w-prose flex-col gap-4">
                                <h2 id="property-description" className="text-2xl font-medium tracking-tight">
                                    {t('property.description_title')}
                                </h2>
                                <p className="text-base/7 text-pretty">{property.excerpt}</p>
                            </section>

                            {property.features && property.features.length > 0 && (
                                <section aria-labelledby="property-features" className="flex flex-col gap-4">
                                    <h2 id="property-features" className="text-2xl font-medium tracking-tight">
                                        {t('property.features_title')}
                                    </h2>
                                    <ul role="list" className="flex flex-wrap gap-2">
                                        {property.features.map((feature) => (
                                            <li key={feature} className="border-border flex items-center gap-1.5 border px-2.5 py-1 text-sm">
                                                <Check aria-hidden className="text-secondary-80 size-3.5" />
                                                {t(`properties.feature.${feature}`)}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            <GradientHairline />

                            <section aria-labelledby="property-location" className="flex flex-col gap-4">
                                <h2 id="property-location" className="text-2xl font-medium tracking-tight">
                                    {t('property.location_title')}
                                </h2>
                                <p className="max-w-prose text-base/7 text-pretty">
                                    {t('property.location_text', { area: property.area, arrondissement })}
                                </p>
                                <ul role="list" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
                                    <li>
                                        <Link href={district.url} prefetch className={cn(linkClass, 'inline-flex items-center gap-1')}>
                                            {t('property.district_link', { arrondissement })}
                                            <ArrowUpRight aria-hidden className="size-4" />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href={district.profileUrl} prefetch className={cn(linkClass, 'inline-flex items-center gap-1')}>
                                            {t('property.profile_link', { arrondissement })}
                                            <ArrowUpRight aria-hidden className="size-4" />
                                        </Link>
                                    </li>
                                </ul>
                                <PropertiesMap
                                    properties={[property]}
                                    active={null}
                                    onActivate={() => {}}
                                    onSelect={() => {}}
                                    config={map}
                                    fitKey={property.slug}
                                    className="h-72 sm:h-96"
                                />
                            </section>
                        </div>

                        {/* Sticky on desktop, first on mobile? No: the gallery leads on every width, the card follows the header column */}
                        <PropertyAdvisorCard property={property} advisor={advisor} className="lg:sticky lg:top-24" />
                    </div>
                </article>

                {similar.length > 0 && (
                    <section aria-labelledby="property-similar" className="flex flex-col gap-8">
                        <div className="flex flex-col gap-4">
                            <h2 id="property-similar" className="text-2xl font-medium tracking-tight">
                                {t('property.similar_title')}
                            </h2>
                            <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{t('property.similar_intro')}</p>
                        </div>
                        <ul role="list" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {similar.map((item) => (
                                <li key={item.slug} className="flex">
                                    <PropertyCard property={item} />
                                </li>
                            ))}
                        </ul>
                        <div>
                            <Button asChild variant="outline" size="lg">
                                <Link href={route('properties')} prefetch>
                                    <ArrowLeft aria-hidden />
                                    {t('property.back')}
                                </Link>
                            </Button>
                        </div>
                    </section>
                )}

                <div className="mx-auto w-full max-w-5xl">
                    <CtaCard />
                </div>
            </PublicLayout>
        </>
    );
}
