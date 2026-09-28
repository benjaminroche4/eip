import PropertyPhotos from '@/components/properties/property-photos';
import SeoImage from '@/components/seo/seo-image';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/format-price';
import { linkClass } from '@/lib/hover-surface';
import { ordinal } from '@/lib/ordinal';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { BedDouble, Check, Columns3, LayoutGrid, Lock, Maximize2, Sparkles } from 'lucide-react';
import { type ReactNode } from 'react';

export type Property = {
    slug: string;
    title: string;
    arrondissement: number;
    area: string;
    type: string;
    transaction: 'sale' | 'rent';
    /** Sale price, or the monthly rent. */
    price: number;
    surface: number;
    rooms: number;
    bedrooms: number;
    excerpt: string;
    /** `{w}` templates, 800 and 1600 available; the card scrolls through them. */
    photos: string[];
    photo_alt: string;
    /** Advisor in charge (1-3, `public/images/advisors/`). */
    advisor: number;
    available: boolean;
    /** WGS84 position for the map. */
    lat: number;
    lng: number;
    /** Confidential listing: the card hides its details (2026-09-28). */
    off_market?: boolean;
    /** Featured listing (« Coup de cœur »): its card stands out in the grid (2026-09-28). */
    featured?: boolean;
    /** Richer data (2026-09-28): amenities (keys of `FEATURES`), state, floor (0 = ground), rental terms, publication. */
    features?: string[];
    condition?: string | null;
    floor?: number | null;
    furnished?: boolean;
    charges_included?: boolean;
    published_at?: string | null;
    /** Published within the last 14 days (server-computed). */
    is_new?: boolean;
    price_sqm?: number;
};

type PropertyCardProps = {
    property: Property;
    active?: boolean;
    onActivate?: (slug: string | null) => void;
    /** Above the fold: the first photo loads eagerly (LCP, 2026-09-28). */
    priority?: boolean;
    /** Comparison (2026-09-28): ticked state and toggle; `compareFull` disables the tick once three are chosen. */
    compared?: boolean;
    onCompare?: (slug: string) => void;
    compareFull?: boolean;
};

/**
 * One property of the listing, after the Relocation in Paris marketplace card (user decision 2026-09-25) in the site's
 * language (square corners, sand hairlines, no shadow): photo inset by `p-1.5`, then the availability badge **inset on the photo** (no advisor portrait, user decision 2026-09-26) (ui.sh variant « Badge sur la photo » chosen among 15, user decision
 * 2026-09-26), the price large on a **sand band** with the price per m² and the fees note (« / mois · charges » for rents; photos scroll and zoom on hover in `PropertyPhotos`), the
 * « Achat · Paris 6e » eyebrow + the listing title as h3 in normal weight, and the footer row « 2 ch. · 4 p. · 128 m² » with thin icons (full wording sr-only) (bedrooms, rooms, surface) with thin icons separated by
 * hairlines. No detail page yet: the card is not a link. `active` = its marker is hovered on the map.
 */
export default function PropertyCard({
    property,
    active = false,
    onActivate,
    priority = false,
    compared = false,
    onCompare,
    compareFull = false,
}: PropertyCardProps) {
    const { t, tc, locale } = useTranslation();
    const arrondissement = `Paris ${ordinal(property.arrondissement, locale)}`;

    const isRent = property.transaction === 'rent';
    const priceNode = (
        <span className="font-heading text-xl font-semibold tabular-nums">
            <span className="sr-only">{t('properties.price')} </span>
            {formatPrice(property.price, locale)}
        </span>
    );
    // On the photo the chip is white; the state is carried by the dot's colour and the wording
    const availability = (
        <Badge variant="outline" className="bg-card/95 text-foreground gap-1.5 rounded-none border-0 px-2 py-0.5 text-[0.6875rem] font-medium">
            <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', property.available ? 'bg-success' : 'bg-muted-foreground')} />
            {property.available ? t('properties.available') : t('properties.unavailable')}
        </Badge>
    );
    // Short eyebrow « Achat · Paris 6e » (the footer row overflowed with the arrondissement) + the listing title in normal weight: the price stays the only heavy element (review 2026-09-26)
    const heading = (
        <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {t(`properties.transaction.${property.transaction}`)} ·{' '}
                <span className="sr-only">{t('properties.location', { arrondissement })}</span>
                <span aria-hidden>{arrondissement}</span>
            </p>
            {/* The title links to the listing's detail page (2026-09-28); the whole card stays hover-only to keep the photos swipeable */}
            <h3 className="text-base/6 font-normal text-balance">
                <Link href={route('properties.show', { slug: property.slug })} prefetch className={cn(linkClass, 'focus-ring')}>
                    {property.title}
                </Link>
            </h3>
        </div>
    );
    const fact = (Icon: typeof BedDouble, sr: string, value: string, className?: string) => (
        <li className={cn('flex items-center gap-1.5 whitespace-nowrap tabular-nums', className)}>
            <Icon aria-hidden className="text-muted-foreground size-4" strokeWidth={1.5} />
            {sr === value ? (
                value
            ) : (
                <>
                    <span className="sr-only">{sr}</span>
                    <span aria-hidden>{value}</span>
                </>
            )}
        </li>
    );
    const facts = (className?: string, itemClass?: string, divider = true) => (
        <ul role="list" className={cn('flex items-center text-sm', className)}>
            {fact(
                BedDouble,
                tc('properties.bedrooms', property.bedrooms, { count: property.bedrooms }),
                t('properties.bedrooms_short', { count: property.bedrooms }),
                itemClass,
            )}
            {divider && <li aria-hidden className="bg-secondary-30 h-5 w-px" />}
            {fact(
                LayoutGrid,
                tc('properties.rooms', property.rooms, { count: property.rooms }),
                t('properties.rooms_short', { count: property.rooms }),
                itemClass,
            )}
            {divider && <li aria-hidden className="bg-secondary-30 h-5 w-px" />}
            {fact(
                Maximize2,
                t('properties.surface', { surface: property.surface }),
                t('properties.surface', { surface: property.surface }),
                itemClass,
            )}
        </ul>
    );
    const photos = <PropertyPhotos photos={property.photos} alt={property.photo_alt} title={property.title} priority={priority} />;
    const shell = (className: string, children: ReactNode) => (
        <article
            id={property.slug}
            data-active={active || undefined}
            onPointerEnter={() => onActivate?.(property.slug)}
            onPointerLeave={() => onActivate?.(null)}
            className={cn('group flex w-full flex-col transition-colors duration-300 motion-reduce:transition-none', className)}
        >
            {children}
        </article>
    );
    const frame = active ? 'border-foreground/40' : 'hover:border-foreground/40';
    const note = (
        <span className="text-right text-xs tabular-nums">
            {isRent ? t('properties.per_month') : t('properties.per_sqm', { price: formatPrice(property.price / property.surface, locale) })}
            <span className="text-muted-foreground"> · {t(isRent ? 'properties.fees_rent' : 'properties.fees_sale')}</span>
        </span>
    );

    // Confidential (off-market) listing, ui.sh « Flou léger + badge » chosen among 15 (user decision 2026-09-28): the same
    // card, one still photo lightly blurred (no carousel), a frosted-glass lock disc in a thin ring centred on the photo (the « Off-market » wording is its accessible name), « Prix sur demande » on the band; the
    // title, arrondissement and facts stay visible. The gated off-market page shows the full cards.
    if (property.off_market) {
        return shell(
            cn('border-border bg-card border p-1.5', frame),
            <>
                <div className="relative">
                    {/* One still photo, no carousel (user decision 2026-09-28): the blur says the rest is reserved */}
                    <div className="overflow-hidden">
                        <SeoImage
                            src={property.photos[0].replace('{w}', '1600')}
                            srcSet={`${property.photos[0].replace('{w}', '800')} 800w, ${property.photos[0].replace('{w}', '1600')} 1600w`}
                            sizes="(min-width: 64rem) 24rem, (min-width: 40rem) 50vw, 100vw"
                            alt={property.photo_alt}
                            width={1600}
                            height={1200}
                            priority={priority}
                            className="aspect-[4/3] w-full scale-110 object-cover blur-sm"
                        />
                    </div>
                    {/* Frosted-glass lock centred on the blurred photo: a glass disc inside a thin white ring (ui.sh « Double anneau » chosen among 15 glass icons, user decision 2026-09-28) */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span
                            role="img"
                            aria-label={t('off_market.badge')}
                            className="flex size-18 items-center justify-center rounded-full ring-1 ring-white/30"
                        >
                            <span className="flex size-14 items-center justify-center rounded-full bg-white/25 text-white ring-1 ring-white/50 backdrop-blur-md ring-inset">
                                <Lock aria-hidden className="size-6" strokeWidth={1.5} />
                            </span>
                        </span>
                    </div>
                </div>
                <p className="bg-background-05 flex flex-wrap items-baseline justify-between gap-x-3 px-3 py-2">
                    <span className="font-heading text-xl font-semibold">
                        <span className="sr-only">{t('properties.price')}: </span>
                        {t('off_market.price_on_request')}
                    </span>{' '}
                    <span className="text-muted-foreground text-right text-xs">{t('off_market.confidential')}</span>
                </p>
                <div className="flex flex-1 flex-col gap-4 p-3 pt-3">
                    {heading}
                    {facts('border-secondary-30 mt-auto border-t pt-3', 'flex-1 justify-center')}
                </div>
            </>,
        );
    }

    // « Nouveau » (published within 14 days, 2026-09-28): a sand chip next to the availability
    const newChip = property.is_new ? (
        <Badge variant="outline" className="bg-secondary-60 text-foreground rounded-none border-0 px-2 py-0.5 text-[0.6875rem] font-medium">
            {t('properties.new')}
        </Badge>
    ) : null;
    // Comparison tick, top right of the photo (2026-09-28): white chip, dark once ticked; disabled past three
    const compareToggle = onCompare ? (
        <button
            type="button"
            aria-pressed={compared}
            aria-disabled={!compared && compareFull ? true : undefined}
            aria-label={`${compared ? t('properties.compare_remove') : t('properties.compare')} : ${property.title}`}
            title={!compared && compareFull ? t('properties.compare_full') : undefined}
            onClick={() => (compared || !compareFull) && onCompare(property.slug)}
            className={cn(
                'focus-ring absolute top-3 right-3 flex items-center gap-1.5 rounded-none px-2 py-0.5 text-[0.6875rem] font-medium transition-colors duration-300 motion-reduce:transition-none',
                compared ? 'bg-primary text-primary-foreground' : 'bg-card/95 text-foreground hover:bg-card',
                !compared && compareFull && 'cursor-default opacity-60',
            )}
        >
            {compared ? <Check aria-hidden className="size-3" /> : <Columns3 aria-hidden className="size-3" />}
            {t('properties.compare')}
        </button>
    ) : null;

    // Featured listing (« Coup de cœur »), ui.sh « Balayage lumineux » chosen among 20 (user decision 2026-09-28): the same
    // card with a sand « Coup de cœur » chip next to the availability on the photo, and the site's light sweep
    // (`sweep-shimmer`, as on the header button and the price chips of the districts) crossing the price band; hidden
    // under reduced motion, the chip alone then carries the distinction.
    if (property.featured) {
        return shell(
            cn('border-border bg-card border p-1.5', frame),
            <>
                <div className="relative">
                    {photos}
                    {compareToggle}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {availability}
                        {newChip}
                        <Badge
                            variant="outline"
                            className="bg-secondary-60 text-foreground gap-1.5 rounded-none border-0 py-0.5 pr-2 pl-1.5 text-[0.6875rem] font-medium"
                        >
                            <Sparkles aria-hidden className="size-3" strokeWidth={1.5} />
                            {t('properties.featured')}
                        </Badge>
                    </div>
                </div>
                <p className="bg-background-05 relative flex flex-wrap items-baseline justify-between gap-x-3 overflow-hidden px-3 py-2">
                    <span
                        aria-hidden
                        className="animate-sweep-shimmer via-secondary-30/70 pointer-events-none absolute inset-y-0 left-0 w-1/2 skew-x-[-12deg] bg-linear-to-r from-transparent to-transparent blur-[2px] motion-reduce:hidden"
                    />
                    {priceNode} {note}
                </p>
                <div className="flex flex-1 flex-col gap-4 p-3 pt-3">
                    {heading}
                    {facts('border-secondary-30 mt-auto border-t pt-3', 'flex-1 justify-center')}
                </div>
            </>,
        );
    }

    return shell(
        cn('border-border bg-card border p-1.5', frame),
        <>
            <div className="relative">
                {photos}
                {/* Availability inset on the photo (ui.sh « Badge sur la photo », user decision 2026-09-26; the advisor portrait was removed the same day) */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {availability}
                    {newChip}
                </div>
                {compareToggle}
            </div>
            {/* Price band glued to the photo (ui.sh « Bandeau collé à la photo » chosen among 15 structures, user decision 2026-09-26): the price per m² in the text colour, only the fees note muted */}
            <p className="bg-background-05 flex flex-wrap items-baseline justify-between gap-x-3 px-3 py-2">
                {priceNode} {note}
            </p>
            <div className="flex flex-1 flex-col gap-4 p-3 pt-3">
                {heading}
                {facts('border-secondary-30 mt-auto border-t pt-3', 'flex-1 justify-center')}
            </div>
        </>,
    );
}
