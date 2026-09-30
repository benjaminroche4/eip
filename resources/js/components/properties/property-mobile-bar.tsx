import PropertyAdvisorCard, { type Advisor } from '@/components/properties/property-advisor-card';
import { type Property } from '@/components/properties/property-card';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useScrolled } from '@/hooks/use-scrolled';
import { useTranslation } from '@/hooks/use-translation';
import { scrollBehavior } from '@/lib/focus-field';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { ArrowUp, ChevronUp } from 'lucide-react';
import { type RefObject, useEffect, useRef, useState } from 'react';

type PropertyMobileBarProps = {
    property: Property;
    advisor: Advisor;
    reference: string;
    /** The block that ends the bar's job (the similar listings): the bar leaves as soon as it is in view or scrolled past. */
    until?: RefObject<HTMLElement | null>;
};

/**
 * Mobile / tablet only (`lg:hidden`), detail page: the advisor card of the desktop column is replaced by a bar fixed to
 * the bottom of the screen from the first pixel (user decision 2026-09-29, it used to appear only once the in-flow card
 * had scrolled past): price and availability, « Demander une visite », and a chevron that opens the whole card (price
 * per m², drop, advisor, viewing request, phone) in a non-modal bottom sheet stopping above the bar, as on the
 * estimate page. Built like the « Vendre » bar (`bg-card`, top hairline, safe area). Closed as soon as the viewport
 * reaches `lg`, where the sticky column takes over.
 */
export default function PropertyMobileBar({ property, advisor, reference, until }: PropertyMobileBarProps) {
    const { t, locale } = useTranslation();
    const sheet = useRef<HTMLDivElement>(null);
    // « Retour en haut » (mobile review 2026-09-30): a small button above the bar once the photos are far behind
    const scrolled = useScrolled(600);
    const perSqm = formatPrice(property.price_sqm ?? Math.round(property.price / property.surface), locale);
    const [open, setOpen] = useState(false);
    // The bar stops before the similar listings (user decision 2026-09-30): gone once that block is in view or scrolled
    // past (its top above the viewport's bottom), back when it goes below the viewport again (the Sell page's rule)
    const [endReached, setEndReached] = useState(false);
    useEffect(() => {
        const end = until?.current;
        if (!end || typeof IntersectionObserver === 'undefined') return;
        const watch = new IntersectionObserver(([entry]) => setEndReached(entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight));
        watch.observe(end);
        return () => watch.disconnect();
    }, [until]);
    const bar = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 64rem)');
        const onChange = (e: MediaQueryListEvent) => e.matches && setOpen(false);
        desktop.addEventListener('change', onChange);
        return () => desktop.removeEventListener('change', onChange);
    }, []);

    if (endReached) return null;

    return (
        <>
            {/* Room under the page for the bar: the layout's own gap and bottom padding (4 rem + 4 rem) already cover most of the
                bar (4.5 rem); 1 rem more leaves the 4 rem the other pages show above the footer (mobile spacing review 2026-09-30) */}
            <div aria-hidden className="h-4 lg:hidden" />
            {/* Dim over the page while the card is up (non-modal sheets have no overlay); a tap closes it. Sibling of the bar: a `fixed` child of a backdrop-blur element would be trapped inside it */}
            {open && (
                <div
                    aria-hidden
                    onClick={() => setOpen(false)}
                    className="animate-fade-in fixed inset-0 z-40 bg-black/30 motion-reduce:animate-none lg:hidden"
                />
            )}
            {scrolled && !open && (
                <button
                    type="button"
                    aria-label={t('property.back_to_top')}
                    onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
                    className="focus-ring border-border bg-card/95 text-foreground animate-fade-in fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 z-60 flex size-10 items-center justify-center border backdrop-blur motion-reduce:animate-none lg:hidden"
                >
                    <ArrowUp aria-hidden className="size-4" strokeWidth={1.5} />
                </button>
            )}
            <div
                ref={bar}
                className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-60 flex items-center gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
            >
                {/* Less in the bar, one gesture to open (user decision 2026-09-30): the whole bar is the trigger — price and
                    price per m² on the left, the chevron on the right; the visit request lives in the card it opens */}
                {/* Non-modal: the bar underneath stays in the accessibility tree and clickable while the card is up */}
                <Sheet open={open} onOpenChange={setOpen} modal={false}>
                    <SheetTrigger asChild>
                        <button
                            type="button"
                            aria-label={t('property.details_open')}
                            aria-expanded={open}
                            className="focus-ring flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                        >
                            <span className="flex min-w-0 flex-col">
                                <span className="font-heading truncate text-lg font-semibold tabular-nums">
                                    {formatPrice(property.price, locale)}
                                    {property.transaction === 'rent' && (
                                        <span className="text-muted-foreground text-xs font-normal"> {t('property.per_month')}</span>
                                    )}
                                </span>
                                <span className="text-muted-foreground text-xs tabular-nums">{t('property.price_per_sqm', { price: perSqm })}</span>
                            </span>
                            <span aria-hidden className="border-border bg-card flex size-10 shrink-0 items-center justify-center border">
                                {/* One chevron that flips over (rotateX) as the card opens / closes, as on the estimate bar */}
                                <ChevronUp
                                    className={cn(
                                        'size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                                        open && 'rotate-x-180',
                                    )}
                                />
                            </span>
                        </button>
                    </SheetTrigger>
                    <SheetContent
                        ref={sheet}
                        side="bottom"
                        hideClose
                        // The focus lands on the sheet itself, not on its first focusable element (the fees « i » button, whose
                        // tooltip opened on focus every time the sheet came up — bug 2026-09-30)
                        onOpenAutoFocus={(e) => {
                            e.preventDefault();
                            sheet.current?.focus({ preventScroll: true });
                        }}
                        // Stops above the bar (its height + safe area); a tap on the bar is not "outside": the chevron toggles, the button navigates
                        onPointerDownOutside={(e) => bar.current?.contains(e.target as Node) && e.preventDefault()}
                        className="bg-card bottom-[calc(4.5rem+env(safe-area-inset-bottom))] max-h-[75dvh] overflow-y-auto border-t p-0"
                    >
                        <SheetTitle className="sr-only">{t('property.advisor_title')}</SheetTitle>
                        <SheetDescription className="sr-only">{t('property.details_description')}</SheetDescription>
                        <PropertyAdvisorCard property={property} advisor={advisor} reference={reference} className="border-0 p-0" />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
