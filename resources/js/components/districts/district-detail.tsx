import DistrictPriceCard from '@/components/districts/district-price-card';
import DistrictProfile from '@/components/districts/district-profile';
import { type District } from '@/components/districts/paris-map';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { useRef } from 'react';

type DistrictDetailProps = { items: District[]; selected: number | null; /** Layout override of the root. */ className?: string };

/**
 * Detail block under the hero map (2026-09-22, reworked 2026-09-23 « la card à droite et le texte à gauche avec des
 * icônes », then 2026-09-25 « un style un peu plus comme le blog »): two columns from `lg` — on the left the selected
 * arrondissement's story laid out like an article (lead paragraph = the detailed summary, « Points forts » dot list,
 * « À qui ça s'adresse » and « Typologie » paragraphs, then — 2026-09-25 « détaille beaucoup plus » — « Se déplacer »
 * with the metro / RER badges in the lines' colours and the railway stations, and chip lists of sights, food,
 * green spaces and schools / universities, « À retenir » sand double card with its icon tile), on the right the site's card (sticky) with the name, districts, the price per m²
 * in large, the profile chip and a contact button. All 20 blocks are in the HTML (`hidden` except the selected one,
 * ids `arrondissement-N` for the JSON-LD anchors); while nothing is selected a **skeleton** of the profile shows (greyed
 * lines on the left, the card with the hint on the right — ui.sh variant chosen among 15, user decision 2026-09-25; `aria-live`).
 */
export default function DistrictDetail({ items, selected, className }: DistrictDetailProps) {
    const { t } = useTranslation();
    // Price context (2026-09-25): rank among the 20 and distance to the dearest, from the rounded prices
    const priceOf = (d: District) => Number(d.price.replace(/\D/g, ''));
    const ranked = [...items].sort((a, b) => priceOf(b) - priceOf(a));
    const max = ranked[0] ? priceOf(ranked[0]) : 0;
    // The price rolls from the previous arrondissement's price to the new one — only the difference moves (user
    // decision 2026-09-25); the first selection counts up from 0. Refs settled during render: `from` stays put across
    // re-renders of the same selection, so the counter never restarts from its own target.
    const lastSelected = useRef<number | null>(null);
    const from = useRef(0);
    if (lastSelected.current !== selected) {
        const previous = items.find((d) => d.n === lastSelected.current);
        from.current = previous ? priceOf(previous) : 0;
        lastSelected.current = selected;
    }

    return (
        <div aria-live="polite" className={cn('flex w-full flex-col', className)}>
            {/* Skeleton of the coming profile: the left column's greyed lines mirror the article layout (eyebrow, name,
                districts, lead paragraph), the right column is the site's card with the hint — ui.sh variant « Squelette de la
                fiche » chosen among 15 (user decision 2026-09-25) */}
            {selected === null && (
                <div className="mx-auto grid w-full max-w-4xl gap-10 lg:grid-cols-[3fr_2fr] lg:gap-16">
                    <div aria-hidden className="flex flex-col gap-4">
                        <span className="bg-background-08 h-3 w-32" />
                        <span className="bg-background-10 h-7 w-56" />
                        <span className="bg-background-08 h-3 w-40" />
                        <span className="bg-background-05 mt-6 h-3 w-full" />
                        <span className="bg-background-05 h-3 w-11/12" />
                        <span className="bg-background-05 h-3 w-4/5" />
                    </div>
                    <div className="border-secondary-30 bg-card flex border p-2">
                        <div className="from-background-05 flex w-full flex-col items-center justify-center gap-3 bg-linear-to-b to-transparent px-6 py-10 text-center">
                            <MapPin aria-hidden className="text-secondary-80 size-5" />
                            <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{t('districts.detail_placeholder')}</p>
                        </div>
                    </div>
                </div>
            )}
            {items.map((d) => (
                <section
                    key={d.n}
                    id={`arrondissement-${d.n}`}
                    aria-labelledby={`arrondissement-${d.n}-title`}
                    hidden={d.n !== selected}
                    className={cn('flex-col gap-10 lg:grid lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-16', d.n === selected && 'flex')}
                >
                    {/* Left: the profile column on its vertical sand thread (`district-profile.tsx`, ui.sh variant chosen among 20, 2026-09-25) */}
                    <DistrictProfile d={d} />

                    {/* Right: the price card (`district-price-card.tsx`, price in a white chip, ui.sh variant chosen among 20 on 2026-09-25) — first on mobile
                        (user decision 2026-09-25): the price and the action before the long profile; sticky right column from lg */}
                    <DistrictPriceCard
                        d={d}
                        run={d.n === selected}
                        from={from.current}
                        rank={ranked.findIndex((r) => r.n === d.n) + 1}
                        total={items.length}
                        pct={priceOf(d) >= max ? 0 : Math.round(((max - priceOf(d)) / max) * 100)}
                        dearest={ranked[0]}
                        className="order-first lg:sticky lg:top-24 lg:order-none"
                    />
                    {/* Mobile: the card sits first, so the action is repeated once the long column is read (2026-09-25) */}
                    <div className="lg:hidden">
                        <Button asChild size="lg" className="w-full">
                            <Link href={route('contact', { district: d.n })} prefetch>
                                {t('districts.cta')}
                                <ArrowUpRight aria-hidden />
                            </Link>
                        </Button>
                    </div>
                </section>
            ))}
        </div>
    );
}
