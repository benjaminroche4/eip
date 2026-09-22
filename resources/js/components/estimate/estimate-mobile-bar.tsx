import EstimateRecap from '@/components/estimate/estimate-recap';
import { type EstimateFormData, FORM_ID } from '@/components/estimate/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTranslation } from '@/hooks/use-translation';
import { ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type EstimateMobileBarProps = {
    values: EstimateFormData;
    processing: boolean;
};

/**
 * Mobile only (`lg:hidden`): the submit bar sticks to the bottom of the screen while the form is on screen, then scrolls
 * away with it (no second button: the in-form one is desktop only). Its arrow opens the recap in a non-modal bottom
 * sheet that stops above the bar; a dim over the page closes it on tap. Closed as soon as the viewport reaches `lg`.
 */
export default function EstimateMobileBar({ values, processing }: EstimateMobileBarProps) {
    const { t } = useTranslation();
    const [recapOpen, setRecapOpen] = useState(false);
    // The sheet belongs to the mobile layout: close it as soon as the viewport reaches the desktop breakpoint (lg)
    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 64rem)');
        const onChange = (e: MediaQueryListEvent) => e.matches && setRecapOpen(false);
        desktop.addEventListener('change', onChange);
        return () => desktop.removeEventListener('change', onChange);
    }, []);
    const mobileBar = useRef<HTMLDivElement>(null);
    // The sheet is `fixed` just above where the bar sits when stuck to the bottom of the screen. Past the end of the
    // form the bar scrolls away with the column: bring it back to the screen bottom before the sheet opens above it.
    const toggleRecap = (open: boolean) => {
        const bar = mobileBar.current;
        if (open && bar) {
            const delta = bar.getBoundingClientRect().bottom - window.innerHeight;
            if (Math.abs(delta) > 1) {
                window.scrollBy({ top: delta, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
            }
        }
        setRecapOpen(open);
    };

    return (
        <>
            {/* Dim over the page while the recap is up (non-modal sheets have no overlay); a tap closes it. Sibling of the bar: a `fixed` child of a backdrop-blur element would be trapped inside it */}
            {recapOpen && (
                <div
                    aria-hidden
                    onClick={() => setRecapOpen(false)}
                    className="animate-fade-in fixed inset-0 z-40 bg-black/30 motion-reduce:animate-none lg:hidden"
                />
            )}
            <div
                ref={mobileBar}
                className="border-border bg-card/95 pointer-events-auto sticky bottom-0 z-60 -mx-6 mt-6 flex items-center gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
            >
                <Button type="submit" form={FORM_ID} size="lg" disabled={processing} className="flex-1">
                    {processing ? t('estimate.submitting') : t('estimate.submit')}
                    <ArrowUpRight aria-hidden />
                </Button>
                {/* Non-modal: the bar underneath stays in the accessibility tree and clickable while the recap is up */}
                <Sheet open={recapOpen} onOpenChange={toggleRecap} modal={false}>
                    <SheetTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            aria-label={t('estimate.recap_open')}
                            aria-expanded={recapOpen}
                            className="px-3"
                        >
                            {recapOpen ? <ChevronDown aria-hidden /> : <ChevronUp aria-hidden />}
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="bottom"
                        hideClose
                        // Stops above the bar (its height + safe area); a tap on the bar is not "outside" — the arrow toggles, the button submits
                        onPointerDownOutside={(e) => mobileBar.current?.contains(e.target as Node) && e.preventDefault()}
                        className="bg-card bottom-[calc(4.5rem+env(safe-area-inset-bottom))] max-h-[75dvh] overflow-y-auto border-t p-0"
                    >
                        <SheetTitle className="sr-only">{t('estimate.recap_title')}</SheetTitle>
                        <SheetDescription className="sr-only">{t('estimate.recap_progress')}</SheetDescription>
                        <EstimateRecap values={values} frameless />
                    </SheetContent>
                </Sheet>
            </div>
            {/* Breathing room under the bar once it has left the screen bottom and rides with the end of the form */}
            <div aria-hidden className="h-10 lg:hidden" />
        </>
    );
}
