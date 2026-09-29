import BorderShimmer from '@/components/page/border-shimmer';
import PropertyPhotos from '@/components/properties/property-photos';
import SeoImage from '@/components/seo/seo-image';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/format-price';
import { ordinal } from '@/lib/ordinal';
import { propertyUrl } from '@/lib/property-url';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
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
    price_sqm?: number /** Detail page content (2026-09-28). */;
    description?: string[];
    rooms_detail?: { name: string; surface: number }[];
    year_built?: number | null;
    heating?: string | null;
    orientation?: string | null;
    annual_charges?: number | null;
    property_tax?: number | null;
    dpe?: { energy: string; climate: string; cost_min: number; cost_max: number; year: number } | null;
    lots?: number | null;
    procedure?: boolean | null;
    rent_reference?: number | null;
    deposit?: number | null;
    price_history?: { date: string; price: number }[];
    visits?: string[];
    transport?: { name: string; kind: 'metro' | 'rer'; lines: string[]; minutes: number }[];
    sold_at?: string | null;
    days_to_sell?: number | null;
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
 * hairlines. The title links to the detail page and a click anywhere on the card follows it (2026-09-29). `active` = its marker is hovered on the map: the card then shows its
 * hover state (see `shell`, hover rework 2026-09-29).
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
    const url = propertyUrl(property, locale);

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
            {/* The title is the real link to the detail page (2026-09-28); the whole card follows it on click (2026-09-29, see `onClick`) */}
            <h3 className="text-base/6 font-normal text-balance">
                <Link href={url} prefetch className="focus-ring">
                    {property.title}
                </Link>
            </h3>
        </div>
    );
    const fact = (Icon: typeof BedDouble, sr: string, value: string, className?: string) => (
        <li className={cn('flex items-center gap-1.5 whitespace-nowrap tabular-nums', className)}>
            <Icon
                aria-hidden
                className="text-muted-foreground group-hover:text-foreground group-data-active:text-foreground group-focus-within:text-foreground size-4 transition-colors duration-300 motion-reduce:transition-none"
                strokeWidth={1.5}
            />
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
    // The whole card leads to the listing (user decision 2026-09-29): the title stays the real link (keyboard, crawlers);
    // a click anywhere else follows it, unless it landed on a control (photo arrows, comparison tick), came with a
    // modifier (new tab is the link's job), followed a drag of the photos (8px or more), or the listing has no public
    // page (confidential). Plain-text selection is left alone too.
    const pressed = { x: 0, y: 0 };
    const onPointerDown = (e: React.PointerEvent) => {
        pressed.x = e.clientX;
        pressed.y = e.clientY;
    };
    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        if (property.off_market || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if ((e.target as HTMLElement).closest('a, button, input, select, textarea, label')) return;
        if (Math.hypot(e.clientX - pressed.x, e.clientY - pressed.y) >= 8) return;
        if (window.getSelection()?.toString()) return;
        router.visit(url);
    };
    const shell = (className: string, children: ReactNode) => (
        <article
            id={property.slug}
            data-active={active || undefined}
            onPointerEnter={() => onActivate?.(property.slug)}
            onPointerLeave={() => onActivate?.(null)}
            onPointerDown={onPointerDown}
            onClick={onClick}
            className={cn(
                !property.off_market && 'cursor-pointer',
                // Hover, ui.sh « Liseré lumineux » chosen among 15 (user decision 2026-09-29): one state for the pointer, the map
                // chip (`data-active`) and the keyboard (`focus-within`) — the hairline turns sand and the site's light glides
                // along it (`BorderShimmer`, faded in), the fact icons darken, the photo keeps its slow zoom. No underline on the
                // title (user decision). Colours only, 300 ms expo-out; reduced motion hides the light and cuts the transitions.
                'group relative flex w-full flex-col transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                'hover:border-secondary-60 data-active:border-secondary-60 focus-within:border-secondary-60',
                className,
            )}
        >
            {children}
        </article>
    );
    // The sand band deepens with the card's hover / active / focus (the gutter around it turns light sand, the band must stay ahead)
    const bandClass = 'bg-background-05 flex flex-wrap items-baseline justify-between gap-x-3 px-3 py-2';
    // The light along the frame, invisible until the card's hover / active / focus
    const shimmer = (
        <BorderShimmer className="opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100 group-data-active:opacity-100" />
    );
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
            'border-border bg-card border p-1.5',
            <>
                <div className="relative">
                    {shimmer}
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
                <p className={bandClass}>
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
            'border-border bg-card border p-1.5',
            <>
                <div className="relative">
                    {photos}
                    {shimmer}
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
                <p className={cn(bandClass, 'relative overflow-hidden')}>
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
        'border-border bg-card border p-1.5',
        <>
            <div className="relative">
                {photos}
                {shimmer}
                {/* Availability inset on the photo (ui.sh « Badge sur la photo », user decision 2026-09-26; the advisor portrait was removed the same day) */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {availability}
                    {newChip}
                </div>
                {compareToggle}
            </div>
            {/* Price band glued to the photo (ui.sh « Bandeau collé à la photo » chosen among 15 structures, user decision 2026-09-26): the price per m² in the text colour, only the fees note muted */}
            <p className={bandClass}>
                {priceNode} {note}
            </p>
            <div className="flex flex-1 flex-col gap-4 p-3 pt-3">
                {heading}
                {facts('border-secondary-30 mt-auto border-t pt-3', 'flex-1 justify-center')}
            </div>
        </>,
    );
}
