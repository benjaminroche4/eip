import PropertyAdvisorCard, { type Advisor } from '@/components/properties/property-advisor-card';
import { type Property } from '@/components/properties/property-card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type PropertyMobileBarProps = {
    property: Property;
    advisor: Advisor;
    reference: string;
};

/**
 * Mobile / tablet only (`lg:hidden`), detail page: the advisor card of the desktop column is replaced by a bar fixed to
 * the bottom of the screen from the first pixel (user decision 2026-09-29, it used to appear only once the in-flow card
 * had scrolled past): price and availability, « Demander une visite », and a chevron that opens the whole card (price
 * per m², drop, advisor, viewing request, phone) in a non-modal bottom sheet stopping above the bar, as on the
 * estimate page. Built like the « Vendre » bar (`bg-card`, top hairline, safe area). Closed as soon as the viewport
 * reaches `lg`, where the sticky column takes over.
 */
export default function PropertyMobileBar({ property, advisor, reference }: PropertyMobileBarProps) {
    const { t, locale } = useTranslation();
    const [open, setOpen] = useState(false);
    const bar = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 64rem)');
        const onChange = (e: MediaQueryListEvent) => e.matches && setOpen(false);
        desktop.addEventListener('change', onChange);
        return () => desktop.removeEventListener('change', onChange);
    }, []);

    return (
        <>
            {/* Room under the page for the bar */}
            <div aria-hidden className="h-20 lg:hidden" />
            {/* Dim over the page while the card is up (non-modal sheets have no overlay); a tap closes it. Sibling of the bar: a `fixed` child of a backdrop-blur element would be trapped inside it */}
            {open && (
                <div
                    aria-hidden
                    onClick={() => setOpen(false)}
                    className="animate-fade-in fixed inset-0 z-40 bg-black/30 motion-reduce:animate-none lg:hidden"
                />
            )}
            <div
                ref={bar}
                className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-60 flex items-center gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
            >
                <p className="flex min-w-0 flex-1 flex-col">
                    <span className="font-heading truncate text-lg font-semibold tabular-nums">
                        {formatPrice(property.price, locale)}
                        {property.transaction === 'rent' && (
                            <span className="text-muted-foreground text-xs font-normal"> {t('property.per_month')}</span>
                        )}
                    </span>
                    <span className="text-muted-foreground text-xs">
                        {property.available ? t('properties.available') : t('properties.unavailable')}
                    </span>
                </p>
                <Button asChild size="lg">
                    <Link href={route('contact', { property: property.slug })} prefetch>
                        {t('property.contact_cta')}
                        <ArrowUpRight aria-hidden />
                    </Link>
                </Button>
                {/* Non-modal: the bar underneath stays in the accessibility tree and clickable while the card is up */}
                <Sheet open={open} onOpenChange={setOpen} modal={false}>
                    <SheetTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            aria-label={t('property.details_open')}
                            aria-expanded={open}
                            className="bg-card px-3"
                        >
                            {/* One chevron that flips over (rotateX) as the card opens / closes, as on the estimate bar */}
                            <ChevronUp
                                aria-hidden
                                className={cn(
                                    'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                                    open && 'rotate-x-180',
                                )}
                            />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="bottom"
                        hideClose
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
