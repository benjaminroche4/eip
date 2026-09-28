import CountBadge from '@/components/navigation/count-badge';
import MoreFilters, { type MoreFilters as MoreFiltersValue } from '@/components/properties/more-filters';
import PriceRange, { type PriceBounds } from '@/components/properties/price-range';
import ResetButton from '@/components/properties/reset-button';
import SearchBar, { type SearchBarProps } from '@/components/search/search-bar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { LARGE_SCREEN, useMediaQuery } from '@/hooks/use-media-query';
import { useScrolled } from '@/hooks/use-scrolled';
import { useTranslation } from '@/hooks/use-translation';
import { ordinal } from '@/lib/ordinal';
import { cn } from '@/lib/utils';
import { ArrowUpRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type FilterBarProps = Omit<SearchBarProps, 'compact' | 'action' | 'className'> & {
    activeFilters: number;
    total: number;
    onReset: () => void;
    /** The richer criteria under the bar's cells in the modal (2026-09-28). */
    more: MoreFiltersValue;
    onMore: (patch: Partial<MoreFiltersValue>) => void;
    areas: string[];
    priceBounds: PriceBounds;
    className?: string;
};

/**
 * Search bar of « Nos biens » at every width (user decisions 2026-09-28): **exactly the home bar's style** with only
 * the two main criteria (arrondissements, max budget) and, in place of the magnifier, the dark « Filtres » button
 * (badge = number of active filters) that opens the rest of the criteria — room for more in the future — in a modal:
 * a bottom sheet sized to its content under `lg` (the rest of the screen dimmed, as the estimate bar), a centred dialog
 * from `lg` (sand, the title with the site's icon tile — ui.sh variant chosen among 20 on 2026-09-28). The bar is sticky at every width (the site header is not on this page, user decision 2026-09-28) with a blurred white gradient behind, full width.
 * The modal's bar is the full extended one, stacked, followed by « Voir les N biens » (or, at zero result, a notice and
 * « Réinitialiser » — ui.sh variant chosen among 15 on 2026-09-28), closed by that button, the cross or a tap outside.
 */
export default function FilterBar({ activeFilters, total, onReset, more, onMore, areas, priceBounds, className, ...bar }: FilterBarProps) {
    const { t, tc, locale } = useTranslation();
    const [open, setOpen] = useState(false);
    const desktop = useMediaQuery(LARGE_SCREEN);
    // Mobile: once the page is scrolled the pinned bar folds to one line (its criteria in words + « Filtres ») to give
    // the screen back; a tap unfolds it until the top of the page is reached again (user decision 2026-09-28)
    const scrolled = useScrolled(160);
    const [expanded, setExpanded] = useState(false);
    useEffect(() => {
        if (!scrolled) setExpanded(false);
    }, [scrolled]);
    const folded = !desktop && scrolled && !expanded;
    const summary = [
        bar.cities.length === 0 ? t('properties.bar_all') : bar.cities.map((n) => `Paris ${ordinal(n, locale)}`).join(', '),
        bar.budget !== '' ? t('properties.chip_budget', { amount: bar.budget }) : null,
    ]
        .filter(Boolean)
        .join(' · ');

    const trigger = (
        <Button
            type="button"
            size="lg"
            aria-label={activeFilters > 0 ? `${t('properties.filters')}, ${activeFilters}` : t('properties.filters')}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="relative h-auto shrink-0 self-stretch px-0 lg:px-6"
        >
            <span className="flex w-14 items-center justify-center lg:w-auto lg:gap-2">
                <SlidersHorizontal aria-hidden className="size-5" />
                <span className="max-lg:sr-only">{t('properties.filters')}</span>
            </span>
            {/* Number of criteria set in the modal, the site's round sand badge (as « Nos biens » in the header) */}
            {activeFilters > 0 && <CountBadge count={activeFilters} className="absolute top-1.5 right-1.5 lg:static" />}
        </Button>
    );
    // The modal's form (ui.sh variant « Message quand rien ne correspond » chosen among 15, user decision 2026-09-28): the
    // stacked bar without its own button, then « Voir les N biens » — or, at zero result, a sand notice inviting to widen
    // the search with « Réinitialiser » in place of a dead button
    const showLabel = tc('properties.sheet_show', total, { count: total });
    const form = (
        <form
            role="search"
            aria-label={t('properties.search_all')}
            onSubmit={(e) => {
                e.preventDefault();
                setOpen(false);
            }}
            className="flex flex-col gap-4 pt-4"
        >
            <div className="bg-card border-secondary-30 flex flex-col border ring-4 ring-white/25">
                {/* The budget in large rolling digits with a two-thumb slider, on top (user decision 2026-09-28) */}
                <PriceRange
                    transaction={bar.extended?.transaction ?? 'sale'}
                    bounds={priceBounds}
                    min={more.budgetMin}
                    max={bar.budget}
                    onChange={(budgetMin, budget) => {
                        onMore({ budgetMin });
                        bar.setBudget(budget);
                    }}
                />
                <SearchBar {...bar} stacked hideSubmit frameless hideBudget />
                <MoreFilters value={more} onChange={onMore} transaction={bar.extended?.transaction ?? 'sale'} areas={areas} />
            </div>
            {total === 0 ? (
                <div role="status" className="bg-background-08 flex flex-col gap-3 p-4 text-center">
                    <p className="text-sm text-pretty">{t('properties.no_match')}</p>
                    <ResetButton onClick={onReset} size="lg" className="bg-card self-center" />
                </div>
            ) : (
                <Button type="submit" size="lg" className="w-full">
                    {showLabel}
                    <ArrowUpRight aria-hidden />
                </Button>
            )}
        </form>
    );
    const closeButton = (
        <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t('properties.filters_close')}
            onClick={() => setOpen(false)}
            className="bg-card"
        >
            <X aria-hidden />
        </Button>
    );

    return (
        <div
            className={cn(
                // Under lg: pinned with a blurred white gradient veil behind (full width) so the cards fade out under it
                'before:from-background before:via-background/80 z-30 mx-6 before:pointer-events-none before:absolute before:-inset-x-6 before:-top-3 before:-bottom-6 before:-z-10 before:bg-linear-to-b before:to-transparent before:backdrop-blur-sm before:[mask-image:linear-gradient(to_bottom,black_60%,transparent)] lg:mx-auto lg:w-full lg:max-w-4xl lg:before:-inset-x-[50vw]',
                className ?? 'sticky top-3',
            )}
        >
            {folded ? (
                <div className="bg-card border-secondary-30 flex items-stretch border ring-4 ring-white/25">
                    <button
                        type="button"
                        aria-expanded={false}
                        aria-label={t('properties.bar_expand')}
                        onClick={() => setExpanded(true)}
                        className="focus-ring hover:bg-background-05 flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-left text-sm transition-colors duration-300 motion-reduce:transition-none"
                    >
                        <Search aria-hidden className="text-muted-foreground size-4 shrink-0" />
                        <span className="truncate">{summary}</span>
                    </button>
                    {trigger}
                </div>
            ) : (
                <form role="search" aria-label={t('properties.search_quick')} onSubmit={(e) => e.preventDefault()} className="text-left">
                    <SearchBar {...bar} compact action={trigger} />
                </form>
            )}
            {desktop ? (
                <Dialog open={open} onOpenChange={setOpen}>
                    {/* Centred sand dialog; the title carries the sand-hairline icon tile of the site (ui.sh variant « Titre avec tuile icône »
                        chosen among 20, user decision 2026-09-28) */}
                    <DialogContent className="bg-background-05 max-h-[90dvh] overflow-y-auto rounded-none p-6 shadow-none sm:max-w-xl [&>button]:hidden">
                        <div className="flex items-center justify-between gap-3">
                            <DialogTitle className="flex items-center gap-3 text-xl font-medium tracking-tight">
                                <span aria-hidden className="border-secondary-30 bg-card flex size-9 items-center justify-center border">
                                    <SlidersHorizontal className="size-4" strokeWidth={1.5} />
                                </span>
                                {t('properties.filters')}
                            </DialogTitle>
                            {closeButton}
                        </div>
                        <DialogDescription className="sr-only">{t('properties.search_label')}</DialogDescription>
                        {form}
                    </DialogContent>
                </Dialog>
            ) : (
                <>
                    {/* Portalled to <body>: inside the sticky bar (a stacking context) the veil would sit under the page header */}
                    {open &&
                        createPortal(
                            <div
                                aria-hidden
                                onClick={() => setOpen(false)}
                                className="animate-fade-in fixed inset-0 z-40 bg-black/30 motion-reduce:animate-none"
                            />,
                            document.body,
                        )}
                    <Sheet open={open} onOpenChange={setOpen} modal={false}>
                        <SheetContent
                            side="bottom"
                            hideClose
                            className="bg-background-05 flex max-h-[90dvh] flex-col overflow-y-auto border-t p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <SheetTitle className="text-xl font-medium tracking-tight">{t('properties.filters')}</SheetTitle>
                                {closeButton}
                            </div>
                            <SheetDescription className="sr-only">{t('properties.search_label')}</SheetDescription>
                            {form}
                        </SheetContent>
                    </Sheet>
                </>
            )}
        </div>
    );
}
