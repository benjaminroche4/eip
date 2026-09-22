import PageEyebrow from '@/components/page/page-eyebrow';
import SeoImage from '@/components/seo/seo-image';
import { useReveal } from '@/hooks/use-reveal';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import { type CSSProperties, useId, useRef } from 'react';

export type BuyDistrict = {
    /** « Paris 6e » */
    name: string;
    /** « Saint-Germain-des-Prés » */
    area: string;
    text: string;
    /** Average price shown first in the facts line, e.g. « 14 000 €/m² ». */
    price: string;
    /** Short facts after the price (demand, yield…). */
    tags: string[];
    photo_alt: string;
};

/** The district photo: 3/2, zooms on hover like the blog cards. */
const Photo = ({ item, i }: { item: BuyDistrict; i: number }) => (
    <SeoImage
        src={`/images/buy/district-${i + 1}-1600.jpg`}
        srcSet={`/images/buy/district-${i + 1}-800.jpg 800w, /images/buy/district-${i + 1}-1600.jpg 1600w`}
        sizes="(min-width: 80rem) 36rem, (min-width: 40rem) 50vw, 100vw"
        alt={item.photo_alt}
        width={1600}
        height={1067}
        className="aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
    />
);

export type DistrictTexts = { eyebrow: string; title: string; intro: string; price_label: string; price_source: string };

type DistrictCardsProps = {
    /** `aria-labelledby` id of the section (unique per page). */
    id: string;
    /** Header + price wording, passed by the page's wrapper (`buy.districts.*` on Buy, `sell.districts.*` on Sell) so `SharedTranslations` shares only that page's section. */
    texts: DistrictTexts;
    /** The four districts (`buy.districts.items`, prop of the controller), in display order. */
    items: BuyDistrict[];
};

/**
 * District cards (Figma 712-18574 desktop / 712-18884 mobile), shared by the Buy page (« Dans quels quartiers investir ? ») and the
 * Sell page (« Combien vaut le m² dans votre quartier ? », user decision 2026-09-22) through thin wrappers that pass their own texts.
 * Centred header (eyebrow, h2 as a question, answer-first intro), then the four district cards on the Figma's soft
 * sand-to-white gradient, breaking out to the full screen width. Nothing is interactive (no district pages yet).
 * Prices are data (`ui.php`) to keep real.
 *
 * Card style = **the blog card** (user decision 2026-09-22, ui.sh variant « Carte blog » chosen over the Figma's bare
 * luxury-house layout, the site's sand card, a success-story veil and numbered editorial rows): light `border-border`
 * frame that darkens on hover, photo inset by `p-2` (3/2, zooms on hover) with the arrondissement **inlaid** in its
 * top-left corner (white square-cornered tile, Montserrat small capitals — user request 2026-09-22), then the area as
 * the `text-lg font-medium` title preceded by a framed pin (the services' icon tile, user request 2026-09-22), the
 * sentence, and right under it (no reserved height, no push to the bottom: the gap was judged too large, user decision
 * 2026-09-22) the facts line = one row of square outline chips like the blog tags, the average price as the last, bold chip (ui.sh variant
 * « Rangée de chips, prix compris » chosen among 15 on 2026-09-22; a version with the price on the right under a
 * visible label was tried and reverted the same day, user decision); the prices' dated, named source is printed once
 * under the grid and linked to each price by `aria-describedby` (GEO rule). The cards rise in cascade when the grid enters the viewport (`animate-hero-rise`,
 * `--stagger` 80 ms, `motion-reduce` cancels). Two columns from `sm`, stacked on mobile.
 */
export default function DistrictCards({ id, texts, items }: DistrictCardsProps) {
    const sourceId = useId();
    const gridRef = useRef<HTMLUListElement>(null);
    const revealed = useReveal(gridRef);

    return (
        <section aria-labelledby={id} className="from-background-05 to-background relative left-1/2 w-screen -translate-x-1/2 bg-linear-to-b to-60%">
            <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 sm:py-20 lg:gap-16 lg:px-8">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                    <PageEyebrow>{texts.eyebrow}</PageEyebrow>
                    <h2 id={id} className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                        {texts.title}
                    </h2>
                    {/* GEO: a self-contained sentence (brand + what + where) */}
                    <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{texts.intro}</p>
                </div>

                <ul ref={gridRef} role="list" className="grid gap-6 sm:grid-cols-2 lg:gap-8">
                    {items.map((item, i) => (
                        <li
                            key={item.name}
                            style={{ '--stagger': `${i * 80}ms` } as CSSProperties}
                            className={cn(
                                'group border-border hover:border-foreground/40 bg-card flex flex-col border transition-colors duration-300 motion-reduce:transition-none',
                                revealed
                                    ? 'animate-hero-rise [animation-delay:var(--stagger)] motion-reduce:animate-none'
                                    : 'opacity-0 motion-reduce:opacity-100',
                            )}
                        >
                            <div className="relative p-2">
                                <div className="relative overflow-hidden">
                                    <Photo item={item} i={i} />
                                </div>
                                {/* Arrondissement inlaid in the top-left corner of the photo: a white square-cornered tile flush with the photo (decorative, the h3 carries the name) */}
                                <span
                                    aria-hidden
                                    className="bg-card text-text-heading font-heading absolute top-2 left-2 px-3 py-1.5 text-xs font-medium tracking-wider uppercase"
                                >
                                    {item.name}
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col gap-3 p-5 pt-3">
                                {/* A framed pin (the services' icon tile) before the area name; the arrondissement stays in the h3 for screen readers */}
                                <h3 className="flex items-center gap-3 text-lg font-medium">
                                    <span
                                        aria-hidden
                                        className="border-secondary-30 bg-background-08 flex size-9 shrink-0 items-center justify-center border"
                                    >
                                        <MapPin className="size-4" strokeWidth={1.5} />
                                    </span>
                                    <span>
                                        <span className="sr-only">{item.name}, </span>
                                        {item.area}
                                    </span>
                                </h3>
                                <p className="text-muted-foreground line-clamp-2 text-base/7 text-pretty sm:text-sm/6">{item.text}</p>
                                {/* Facts line: one row of square-cornered outline chips (as the blog tags), the average price as the last, bold chip, described by the dated source under the grid */}
                                <ul role="list" className="flex flex-wrap items-center gap-1.5 pt-2">
                                    {item.tags.map((tag) => (
                                        <li key={tag} className="border-border text-muted-foreground border px-2 py-0.5 text-xs">
                                            {tag}
                                        </li>
                                    ))}
                                    <li
                                        className="border-border text-text-heading relative overflow-hidden border px-2 py-0.5 text-xs font-medium tabular-nums"
                                        aria-describedby={sourceId}
                                    >
                                        {/* Discreet shimmer: a faint sand light band sweeps across the price chip (user decision 2026-09-22) */}
                                        <span
                                            aria-hidden
                                            className="via-secondary-30/70 animate-sweep-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-transparent to-transparent blur-[2px] motion-reduce:hidden"
                                        />
                                        <span className="sr-only">{texts.price_label} </span>
                                        <span className="relative">{item.price}</span>
                                    </li>
                                </ul>
                            </div>
                        </li>
                    ))}
                </ul>
                {/* GEO: the prices' dated, named source, once under the grid */}
                <p id={sourceId} className="text-muted-foreground -mt-4 text-xs text-pretty lg:-mt-8">
                    {texts.price_source}
                </p>
            </div>
        </section>
    );
}
