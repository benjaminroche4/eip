import GradientHairline from '@/components/layout/gradient-hairline';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoImage from '@/components/seo/seo-image';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

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

type Ctx = { item: BuyDistrict; i: number; t: (key: string) => string };

/** Pieces of the card body. */
const Photo = ({ item, i, className, aspect = 'aspect-[3/2] lg:aspect-[4/3]' }: Ctx & { className?: string; aspect?: string }) => (
    <SeoImage
        src={`/images/buy/district-${i + 1}-1600.jpg`}
        srcSet={`/images/buy/district-${i + 1}-800.jpg 800w, /images/buy/district-${i + 1}-1600.jpg 1600w`}
        sizes="(min-width: 80rem) 38rem, (min-width: 64rem) 50vw, 100vw"
        alt={item.photo_alt}
        width={1600}
        height={1067}
        className={cn(
            'w-full object-cover transition-transform duration-1000 group-hover:scale-[1.03] motion-reduce:transition-none',
            aspect,
            className,
        )}
    />
);

type BuyDistrictsProps = {
    /** The four districts (`buy.districts.items`, prop of the controller), in display order. */
    items: BuyDistrict[];
};

/**
 * « Quartiers prisés pour investir » (Figma 712-18574 desktop / 712-18884 mobile), under the strategies, **kept in the
 * Figma's own style** (user decision 2026-09-21): a bare photo (square corners instead of the Figma's rounded ones, zooms
 * on hover like the blog cards, slower here), then under it, with no frame and a lot of air (luxury-house tone, user
 * decision 2026-09-21 after two ui.sh rounds): the arrondissement as a small tracked uppercase label with a thin pin, the
 * area as a large light Montserrat title, the sentence, a gradient hairline, then the facts line — short facts in small
 * tracked capitals separated by thin rules, the price on the right in plain text (no chip, no tile, no frame); the whole section on the
 * Figma's soft sand-to-white gradient, breaking out to the full screen width (its decorative wave SVG is dropped).
 * Centred header (eyebrow, h2 as a question, answer-first intro). Stacked on mobile like the Figma; on desktop a
 * 2×2 grid of **equal** cards (the Figma's wide / narrow rhythm gave photos of different heights — user decision
 * 2026-09-21). Nothing is interactive (no district pages yet). Prices are data
 * (`ui.php`) to keep real.
 */
export default function BuyDistricts({ items }: BuyDistrictsProps) {
    const { t } = useTranslation();

    return (
        <section
            aria-labelledby="buy-districts-title"
            className="from-background-05 to-background relative left-1/2 w-screen -translate-x-1/2 bg-linear-to-b to-60%"
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 sm:py-20 lg:gap-16 lg:px-8">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                    <PageEyebrow>{t('buy.districts.eyebrow')}</PageEyebrow>
                    <h2 id="buy-districts-title" className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                        {t('buy.districts.title')}
                    </h2>
                    {/* GEO: a self-contained sentence (brand + what + where) */}
                    <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{t('buy.districts.intro')}</p>
                </div>

                <ul role="list" className="grid gap-14 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-20">
                    {items.map((item, i) => (
                        <li key={item.name} className="group flex flex-col">
                            <div className="overflow-hidden">
                                <Photo item={item} i={i} t={t} />
                            </div>
                            <div className="flex flex-col gap-6 pt-8">
                                <div className="flex flex-col gap-3">
                                    {/* Arrondissement as a small tracked label with a thin pin; the area is the title, in a light Montserrat */}
                                    <h3 className="flex flex-col gap-3">
                                        <span className="text-muted-foreground font-heading flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase">
                                            <MapPin aria-hidden className="size-3.5" strokeWidth={1.5} />
                                            {item.name}
                                        </span>
                                        <span className="sr-only">, </span>
                                        <span className="font-heading text-2xl font-normal tracking-tight text-balance sm:text-3xl">{item.area}</span>
                                    </h3>
                                    <p className="text-muted-foreground max-w-md text-sm/7 text-pretty">{item.text}</p>
                                </div>
                                <GradientHairline />
                                {/* Facts line: short facts in small tracked capitals separated by thin rules, the price on the right — text only, no chip, no frame */}
                                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                                    <ul
                                        role="list"
                                        className="text-muted-foreground font-heading flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tracking-wider uppercase"
                                    >
                                        {item.tags.map((tag, k) => (
                                            <li key={tag} className="flex items-center gap-3">
                                                {k > 0 && <span aria-hidden className="bg-border h-3 w-px" />}
                                                {tag}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-sm tabular-nums">
                                        <span className="sr-only">{t('buy.districts.price_label')} </span>
                                        {item.price}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
