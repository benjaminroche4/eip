import GradientHairline from '@/components/layout/gradient-hairline';
import PageEyebrow from '@/components/page/page-eyebrow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Autoplay: one card every 5 s (user decision 2026-09-16). */
const AUTOPLAY_MS = 5000;

export type ReviewSource = 'google' | 'trustpilot';
export type Testimonial = { name: string; context: string; quote: string; photo?: string | null; source?: ReviewSource };

type TestimonialsProps = { items: Testimonial[] };

/** Five filled stars (decorative: the rating is spelled out next to them). */
function Stars({ className, size = 'size-4' }: { className?: string; size?: string }) {
    return (
        <span aria-hidden className={cn('flex items-center gap-1', className)}>
            {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn(size, 'fill-current')} strokeWidth={0} />
            ))}
        </span>
    );
}

/** « Sophie M. » → « SM »: the initials of the first name and the last name, upper case (never a client photo — user decision 2026-09-23). */
const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('');

/**
 * Round disc with the card ring: the client's initials on the quote cards (never a photo there — user decision
 * 2026-09-23), and with `withPhoto` the owner's three avatars (`public/images/testimonials/client-{1,2,3}.webp`,
 * 160 px WebP, ~4 KB each) in the rating column, initials as the fallback.
 */
function Portrait({ item, className, withPhoto = false }: { item: Testimonial; className?: string; withPhoto?: boolean }) {
    return (
        <Avatar className={cn('ring-card ring-2', className)}>
            {withPhoto && item.photo && <AvatarImage src={item.photo} alt="" loading="lazy" width={160} height={160} />}
            <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">{initials(item.name)}</AvatarFallback>
        </Avatar>
    );
}

/**
 * Testimonials (Figma 712-25299 desktop / 712-25738 mobile), kept in its structure and reworked in the site's tone
 * (user decision 2026-09-16): sand gradient band, centred header, then the rating column (Google rating from
 * `seo.reviews`: giant rating, count with the Google logo linking to the reviews, the three avatars + « +N », previous / next arrows) separated by a vertical gradient hairline
 * from a row of quote cards (site card: sand hairline, inner sand gradient, square corners, no shadow; sand quotation
 * mark, stars, Montserrat quote, round portrait) that scrolls sideways with a right-edge fade (desktop only: on mobile the centred card is not veiled). On mobile the rating
 * opens the block, the portraits / stars / arrows close it, as in the Figma. The rating column only renders with real
 * figures.
 */
export default function Testimonials({ items }: TestimonialsProps) {
    const { t, tc } = useTranslation();
    const { seo } = usePage<SharedData>().props;
    const reviews = seo.reviews;
    const count = reviews ? tc('testimonials.count_short', reviews.count, { count: reviews.count.toLocaleString('fr-FR') }) : '';
    const rowRef = useRef<HTMLUListElement>(null);
    // The row can be dragged with the mouse (touch scrolls natively). Below `lg` a card is always centred (snap to
    // centres, side padding = half the viewport minus half a card); from `lg` the snap settles on a card's start
    // (user decisions 2026-09-16).
    const [desktop, setDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 64rem)');
        const update = () => setDesktop(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);
    useDragScroll(rowRef, { align: desktop ? 'start' : 'center', open: 'first' });
    // Infinite loop (user decision 2026-09-16): the row is rendered three times and kept inside the middle copy, so
    // arrows, drag and touch never meet an end. `span()` = width of one copy; a jump of exactly one span is invisible.
    const loop = items.length > 1;
    const span = useCallback(() => {
        const el = rowRef.current;
        if (!el || !loop) return 0;
        const first = el.children[0] as HTMLElement | undefined;
        const mid = el.children[items.length] as HTMLElement | undefined;
        return first && mid ? mid.offsetLeft - first.offsetLeft : 0;
    }, [loop, items.length]);
    useEffect(() => {
        const el = rowRef.current;
        if (!el || !loop) return;
        const s = span();
        if (s) el.scrollLeft = s;
        const onScroll = () => {
            const s = span();
            if (!s) return;
            if (el.scrollLeft >= s * 1.5) el.scrollLeft -= s;
            else if (el.scrollLeft < s * 0.5) el.scrollLeft += s;
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [loop, span]);
    // Arrows scroll the row by one card (its width + gap); scroll-snap settles it on the next card. If the smooth
    // scroll would cross a loop threshold, the row is first recentred by one span (invisible) so it is never interrupted.
    const scrollBy = useCallback(
        (direction: 1 | -1) => {
            const el = rowRef.current;
            const cards = el ? (Array.from(el.children) as HTMLElement[]) : [];
            if (!el || cards.length === 0) return;
            // One card = the distance between two cards (width + the row's gap, which differs below / from `lg`);
            // a single card falls back to its width (2026-09-22: the fixed `+ 20` drifted off the snap points below lg).
            const step = direction * (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth);
            const s = span();
            if (s) {
                const target = el.scrollLeft + step;
                if (target >= s * 1.5) el.scrollLeft -= s;
                else if (target < s * 0.5) el.scrollLeft += s;
            }
            el.scrollBy({ left: step, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        },
        [span],
    );
    // Autoplay (user decision 2026-09-16, no play / pause button): the row advances one card every 5 s and stops
    // while the pointer hovers the cards — also while a card has the focus, during a touch, when the tab is hidden
    // or the block is out of view, and never under `prefers-reduced-motion`. Every manual move restarts the delay.
    const autoplay = loop;
    const [resting, setResting] = useState(false);
    const [inView, setInView] = useState(true);
    const [tick, setTick] = useState(0);
    const sectionRef = useRef<HTMLElement>(null);
    useEffect(() => {
        const el = sectionRef.current;
        if (!el || !autoplay || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [autoplay]);
    useEffect(() => {
        if (!autoplay || resting || !inView) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const id = window.setInterval(() => {
            if (!document.hidden) scrollBy(1);
        }, AUTOPLAY_MS);
        return () => window.clearInterval(id);
    }, [autoplay, resting, inView, tick, scrollBy]);
    const move = (direction: 1 | -1) => {
        scrollBy(direction);
        setTick((n) => n + 1);
    };
    const rendered = loop ? [...items, ...items, ...items] : items;

    return (
        <section ref={sectionRef} aria-labelledby="testimonials-title" className="from-background-05 to-background bg-linear-to-b from-40%">
            <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-16 sm:py-20 lg:gap-16 lg:px-8">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                    <PageEyebrow>{t('testimonials.eyebrow')}</PageEyebrow>
                    <h2 id="testimonials-title" className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                        {t('testimonials.title')}
                    </h2>
                    <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{t('testimonials.intro')}</p>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
                    {reviews && (
                        <>
                            <RatingColumn items={items} reviews={reviews} count={count} onPrevious={() => move(-1)} onNext={() => move(1)} />
                            <GradientHairline vertical className="hidden lg:block" />
                        </>
                    )}

                    {/* Quote cards: one row that scrolls sideways at every width, fading out on the right edge */}
                    <div
                        className="lg:after:from-background relative min-w-0 flex-1 after:pointer-events-none after:absolute after:inset-y-0 after:-right-8 after:hidden after:w-20 after:bg-linear-to-l after:to-transparent lg:after:block"
                        onPointerEnter={(e) => e.pointerType !== 'touch' && setResting(true)}
                        onPointerLeave={(e) => e.pointerType !== 'touch' && setResting(false)}
                        onTouchStart={() => setResting(true)}
                        onTouchEnd={() => setResting(false)}
                        onTouchCancel={() => setResting(false)}
                        onFocus={() => setResting(true)}
                        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setResting(false)}
                    >
                        <ul
                            ref={rowRef}
                            role="list"
                            className="-mx-6 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-[calc(50%-10rem)] pb-2 [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none data-[dragging=true]:select-none lg:mx-0 lg:gap-5 lg:px-0 [&::-webkit-scrollbar]:hidden"
                        >
                            {rendered.map((item, index) => (
                                // Copies outside the middle set are decorative duplicates: hidden from assistive tech
                                <li
                                    key={`${item.name}-${index}`}
                                    className="w-80 shrink-0 snap-center lg:snap-start"
                                    aria-hidden={loop && (index < items.length || index >= items.length * 2) ? true : undefined}
                                >
                                    <QuoteCard item={item} />
                                </li>
                            ))}
                        </ul>
                        {/* Without real Google figures the rating column (and its arrows) is not rendered: the arrows sit under the row instead, so the row stays keyboard-operable (2026-09-22) */}
                        {!reviews && (
                            <div className="mt-6 flex justify-center">
                                <Arrows onPrevious={() => move(-1)} onNext={() => move(1)} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Quote card: site surface (sand hairline, inner sand gradient), sand quotation mark with the Google / Trustpilot logo top right (source of the review), stars, Montserrat quote, initials disc. */
function QuoteCard({ item }: { item: Testimonial }) {
    const { t } = useTranslation();
    return (
        <figure className="border-secondary-30 bg-card flex h-full border p-2">
            <div className="from-background-05 flex min-h-96 w-full flex-col justify-between gap-8 bg-linear-to-b to-transparent p-6">
                <div className="flex flex-col gap-6">
                    <div className="flex items-start justify-between gap-4">
                        <Quote aria-hidden className="text-secondary-50 size-8 fill-current" strokeWidth={0} />
                        {/* Source of the review, top right (user decision 2026-09-23): the Google or Trustpilot logo (brand marks as `<img>`, `item.source`) with its label for assistive tech */}
                        <span className="flex items-center" title={t(`testimonials.source_${item.source ?? 'google'}`)}>
                            {item.source === 'trustpilot' ? (
                                /* Trustpilot = the full wordmark (star + name), Google = its mark alone — both 16px high (user decision 2026-09-23) */
                                <img src="/images/social/trustpilot-wordmark.svg" alt="" width={230} height={48} className="h-4 w-auto shrink-0" />
                            ) : (
                                <img src="/images/social/google.svg" alt="" width={16} height={16} className="size-4 shrink-0" />
                            )}
                            <span className="sr-only">{t(`testimonials.source_${item.source ?? 'google'}`)}</span>
                        </span>
                    </div>
                    <div className="flex flex-col gap-4">
                        <Stars className="text-foreground" size="size-3.5" />
                        <blockquote className="font-heading text-lg/7 font-medium text-pretty">{item.quote}</blockquote>
                    </div>
                </div>
                <figcaption className="flex items-center gap-3">
                    <Portrait item={item} className="size-10" />
                    <span className="flex flex-col text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground text-xs">{item.context}</span>
                    </span>
                </figcaption>
            </div>
        </figure>
    );
}

const arrowClass = 'group transition-transform active:scale-90 motion-reduce:transition-none';

type RatingColumnProps = {
    items: Testimonial[];
    reviews: NonNullable<SharedData['seo']['reviews']>;
    count: string;
    onPrevious: () => void;
    onNext: () => void;
};

/**
 * Rating column (user decision 2026-09-16, ui.sh variant « Note géante »): the Google rating in `text-5xl sm:text-7xl` (smaller on mobile, user decision 2026-09-22),
 * « Sur +N avis Google » with the Google logo before the word (brand logo file, not an icon), then the round portraits + « +N » and the
 * previous / next arrows on one line. Closes the block on mobile.
 */
function RatingColumn({ items, reviews, count, onPrevious, onNext }: RatingColumnProps) {
    const { t } = useTranslation();
    // « Sur +N avis [G] Google »: the count, then the Google logo right before the visible word (user decision 2026-09-22)
    const google = (
        <span className="inline-flex items-center gap-1.5">
            {count} <img src="/images/social/google.svg" alt="" width={14} height={14} className="size-3.5 shrink-0" />
            <span>Google</span>
        </span>
    );

    return (
        <div className="flex flex-col gap-8 lg:w-72 lg:shrink-0 lg:justify-between lg:py-2">
            <div className="flex flex-col gap-3">
                <p className="flex items-baseline gap-1.5">
                    <span className="font-heading text-5xl font-semibold tracking-tight tabular-nums sm:text-7xl">
                        {reviews.rating.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-muted-foreground text-lg font-medium">/5</span>
                </p>
                {/* Count with the Google logo right under the rating, no stars here (user decision 2026-09-16: the stars stay on the cards) */}
                <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    {reviews.url ? (
                        <a href={reviews.url} target="_blank" rel="noopener noreferrer" className="focus-ring hover:text-foreground">
                            {google}
                            <span className="sr-only"> {t('footer.new_tab')}</span>
                        </a>
                    ) : (
                        google
                    )}
                </p>
            </div>
            <div className="flex items-center justify-between gap-4 max-lg:order-last">
                <ul role="list" className="flex -space-x-3">
                    {items.slice(0, 3).map((item) => (
                        <li key={item.name}>
                            <Portrait item={item} className="size-10" withPhoto />
                        </li>
                    ))}
                    <li>
                        <span className="bg-primary text-primary-foreground ring-card flex size-10 items-center justify-center rounded-full text-xs font-medium tabular-nums ring-2">
                            +{Math.max(reviews.count - 3, 0)}
                        </span>
                    </li>
                </ul>
                <Arrows onPrevious={onPrevious} onNext={onNext} />
            </div>
        </div>
    );
}

/** Previous / next arrows: in the rating column, or under the row when there is no rating column. */
function Arrows({ onPrevious, onNext }: { onPrevious: () => void; onNext: () => void }) {
    const { t } = useTranslation();
    return (
        <div className="flex items-center gap-2">
            {/* Press feedback: the button contracts and the chevron nudges in the scroll direction (user decision 2026-09-16) */}
            <Button type="button" variant="outline" size="icon" className={arrowClass} aria-label={t('testimonials.previous')} onClick={onPrevious}>
                <ChevronLeft aria-hidden className="transition-transform group-active:-translate-x-0.5 motion-reduce:transition-none" />
            </Button>
            <Button type="button" variant="outline" size="icon" className={arrowClass} aria-label={t('testimonials.next')} onClick={onNext}>
                <ChevronRight aria-hidden className="transition-transform group-active:translate-x-0.5 motion-reduce:transition-none" />
            </Button>
        </div>
    );
}
