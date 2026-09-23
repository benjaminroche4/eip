import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { type RefObject, useEffect, useState } from 'react';

type SellMobileCtaProps = {
    /** The hero: the bar appears once it has scrolled past (its bottom edge above the viewport). */
    after: RefObject<HTMLElement | null>;
    /** The closing CTA card: the bar leaves as soon as it is in view or scrolled past (it carries the same action). */
    until: RefObject<HTMLElement | null>;
};

/**
 * Mobile / tablet only (`lg:hidden`), « Vendre » page (2026-09-22, conversion-first): a bar fixed to the bottom of the
 * screen with the page's single primary action « Faire estimer mon bien » → valuation, built like the valuation form's
 * mobile bar (`bg-card`, top hairline, `z-60`, safe-area padding) without the recap. It is mounted only between the
 * hero (IntersectionObserver: once its bottom has passed above the viewport) and the closing CTA card (hidden while
 * the card is visible, which carries the same button), so the action is always one tap away without ever doubling a
 * visible button. Fades in (`animate-fade-in`, `motion-reduce` cancels); never rendered on the server, nor without
 * `IntersectionObserver`.
 */
export default function SellMobileCta({ after, until }: SellMobileCtaProps) {
    const { t } = useTranslation();
    const [heroPassed, setHeroPassed] = useState(false);
    // « End reached » = the closing card is visible **or already scrolled past** (its top above the viewport's bottom):
    // the bar used to come back over the footer once the card was passed (bug 2026-09-22). It only returns when the
    // card goes back below the viewport (scrolling up).
    const [endReached, setEndReached] = useState(false);

    useEffect(() => {
        const hero = after.current;
        const end = until.current;
        if (!hero || !end || typeof IntersectionObserver === 'undefined') return;
        const watchHero = new IntersectionObserver(([entry]) => setHeroPassed(!entry.isIntersecting && entry.boundingClientRect.bottom < 0));
        const watchEnd = new IntersectionObserver(([entry]) =>
            setEndReached(entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight),
        );
        watchHero.observe(hero);
        watchEnd.observe(end);
        return () => {
            watchHero.disconnect();
            watchEnd.disconnect();
        };
    }, [after, until]);

    if (!heroPassed || endReached) return null;

    return (
        <>
            {/* Reserves the bar's height under the content while the bar is mounted, so nothing hides behind it (2026-09-22) */}
            <div aria-hidden className="h-20 lg:hidden" />
            <div className="border-border bg-card/95 animate-fade-in fixed inset-x-0 bottom-0 z-60 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur motion-reduce:animate-none lg:hidden">
                <Button asChild size="lg" className="w-full">
                    <Link href={route('estimate')} prefetch>
                        {t('sell.hero_cta')}
                        <ArrowUpRight aria-hidden />
                    </Link>
                </Button>
            </div>
        </>
    );
}
