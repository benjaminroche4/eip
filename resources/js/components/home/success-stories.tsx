import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { useReveal } from '@/hooks/use-reveal';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type CSSProperties, Fragment, useCallback, useEffect, useRef, useState } from 'react';

export type SuccessStory = { title: string; place: string; duration: string; result: string; photo: string; alt: string };

type SuccessStoriesProps = {
    stories: SuccessStory[];
    /** Home: the quote + blog button under the photos. Sell (2026-09-22) passes `false`: photos and arrows only. */
    quote?: boolean;
    /** Inside a page that already has the layout's gutters and section gaps (Sell): no own padding. */
    embedded?: boolean;
};

/** Same press feedback as the other carousels' arrows. */
/** One photo every 4 s (a touch faster than the testimonials' 5 s — user decision 2026-09-23). */
const AUTOPLAY_MS = 4000;

const arrowClass = 'group transition-transform active:scale-90 motion-reduce:transition-none';

/**
 * « Success stories » (Figma 712-25407 desktop / 712-25844 mobile): photos only (user decision 2026-09-22 — the
 * eyebrow / title / place · duration · result overlay was removed, the story stays in the `alt`), one horizontal
 * snap row at every width, photos in the former card format (`w-80 sm:w-96 lg:w-104`, `h-96 sm:h-112 lg:h-120`), one centred at a time below `lg` and a row starting at the left edge from `lg` (`snap-start`), draggable with the mouse or the finger (`useDragScroll`)
 * with previous / next arrows under the row, disabled at both ends (the infinite loop tried the same day was dropped — user decision 2026-09-22); then a centred Montserrat quote written word by word when it enters
 * the viewport (the about manifesto's reveal) and one button to the blog, where the case studies live. Also used on « Vendre » (2026-09-22) with `quote={false}`
 * and `embedded` in place of the former photo mosaic.
 */
export default function SuccessStories({ stories, quote = true, embedded = false }: SuccessStoriesProps) {
    const { t } = useTranslation();
    const rowRef = useRef<HTMLUListElement>(null);
    const quoteRef = useRef<HTMLDivElement>(null);
    // From lg the row starts at the column's left edge and snaps to photo starts (user decision 2026-09-22: a first
    // photo centred with a blank left half looked like it « started in the middle »); below lg one photo is centred.
    const [desktop, setDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 64rem)');
        const update = () => setDesktop(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);
    const revealed = useReveal(quoteRef, '-15%');

    // The quote is written word by word when it enters the viewport, the same reveal as the about manifesto
    const WORD_MS = 40;
    const animClass = revealed
        ? 'animate-manifesto-in [animation-delay:var(--stagger)] motion-reduce:animate-none'
        : 'opacity-0 motion-reduce:opacity-100';
    const quoteWords = t('stories.quote').split(' ');
    useDragScroll(rowRef, { align: desktop ? 'start' : 'center', open: 'first' });

    // Finite row (user decision 2026-09-22, replaces the infinite loop: with the arrows an end is reached, so it is
    // shown): the arrows move the row by one photo and are disabled (dimmed by the button's disabled style) when the
    // row is at its start / at its end — measured on the scroll position itself, not on a "current card" index, which
    // never reached the last photos on desktop where several fit in the viewport (bug 2026-09-22). From `lg` the last
    // photo snaps on its end (`lg:last:snap-end`): with `snap-start` only, its start lies past the maximum scroll and
    // the row rested on the previous photo, leaving the last one cut (bug 2026-09-22).
    // `overflowing` (2026-09-22): the grab cursor only when the row actually scrolls (`data-overflowing`), and « next »
    // is off as soon as the whole row fits (max = 0). Without layout (jsdom, `scrollWidth` = 0) nothing is measurable:
    // the arrows are left as they are rather than switched off on a guess.
    const [edges, setEdges] = useState({ start: true, end: false, overflowing: false });
    useEffect(() => {
        const el = rowRef.current;
        if (!el) return;
        const measure = () => {
            const measurable = el.scrollWidth > 0;
            const max = el.scrollWidth - el.clientWidth;
            setEdges({
                start: el.scrollLeft <= 1,
                end: measurable && el.scrollLeft >= max - 1,
                overflowing: el.scrollWidth > el.clientWidth + 1,
            });
        };
        measure();
        el.addEventListener('scroll', measure, { passive: true });
        window.addEventListener('resize', measure, { passive: true });
        return () => {
            el.removeEventListener('scroll', measure);
            window.removeEventListener('resize', measure);
        };
    }, []);
    const scrollBy = useCallback((direction: 1 | -1) => {
        const el = rowRef.current;
        const cards = el ? (Array.from(el.children) as HTMLElement[]) : [];
        if (!el || cards.length === 0) return;
        // One photo = the distance between two cards (width + gap); a single card falls back to its width
        const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
        el.scrollBy({ left: direction * step, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }, []);

    // Autoplay (user decision 2026-09-23, the testimonials' pattern): one photo every 4 s, stopped while the pointer
    // is over the row or the arrows — also while a control has the focus, during a touch, when the tab is hidden or
    // the block is out of view, and never under `prefers-reduced-motion`. Every arrow press restarts the delay.
    const autoplay = stories.length > 1;
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

    return (
        <section
            ref={sectionRef}
            aria-labelledby="stories-title"
            className={cn('flex flex-col gap-10 lg:gap-14', !embedded && 'mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8')}
        >
            <h2 id="stories-title" className="sr-only">
                {t('stories.title')}
            </h2>
            <div
                className="flex flex-col items-center gap-6"
                onPointerEnter={(e) => e.pointerType !== 'touch' && setResting(true)}
                onPointerLeave={(e) => e.pointerType !== 'touch' && setResting(false)}
                onTouchStart={() => setResting(true)}
                onFocus={() => setResting(true)}
                onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setResting(false)}
            >
                <ul
                    ref={rowRef}
                    role="list"
                    data-overflowing={edges.overflowing}
                    className="-mx-6 flex w-[calc(100%+3rem)] snap-x snap-mandatory gap-5 overflow-x-auto px-[calc(50%-10rem)] pb-1 select-none [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none data-[overflowing=true]:cursor-grab sm:px-[calc(50%-12rem)] lg:mx-0 lg:w-full lg:px-0 [&::-webkit-scrollbar]:hidden"
                >
                    {stories.map((story) => (
                        <li key={story.title} className="w-80 shrink-0 snap-center sm:w-96 lg:w-104 lg:snap-start lg:last:snap-end">
                            <StoryPhoto story={story} />
                        </li>
                    ))}
                </ul>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={arrowClass}
                        aria-label={t('stories.previous')}
                        disabled={edges.start}
                        onClick={() => move(-1)}
                    >
                        <ChevronLeft aria-hidden className="transition-transform group-active:-translate-x-0.5 motion-reduce:transition-none" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={arrowClass}
                        aria-label={t('stories.next')}
                        disabled={edges.end}
                        onClick={() => move(1)}
                    >
                        <ChevronRight aria-hidden className="transition-transform group-active:translate-x-0.5 motion-reduce:transition-none" />
                    </Button>
                </div>
            </div>

            {quote && (
                <div ref={quoteRef} className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center [perspective:800px]">
                    <p className="font-heading text-xl/snug font-medium text-balance sm:text-2xl/snug">
                        {quoteWords.map((word, i) => (
                            <Fragment key={i}>
                                {i > 0 && ' '}
                                <span style={{ '--stagger': `${i * WORD_MS}ms` } as CSSProperties} className={cn('inline-block', animClass)}>
                                    {word}
                                </span>
                            </Fragment>
                        ))}
                    </p>
                    <Button
                        asChild
                        size="lg"
                        style={{ '--stagger': `${quoteWords.length * WORD_MS + 100}ms` } as CSSProperties}
                        className={animClass}
                    >
                        <Link href={route('blog.index')} prefetch>
                            {t('stories.cta')}
                        </Link>
                    </Button>
                </div>
            )}
        </section>
    );
}

/** One photo: bare, square corners, no veil, no text — the story is in the `alt`. Portrait WebP 480 / 960 px (the card is at most 416 px wide: 960 covers 2× screens). */
function StoryPhoto({ story }: { story: SuccessStory }) {
    return (
        <div className="relative h-96 overflow-hidden sm:h-112 lg:h-120">
            <SeoImage
                src={story.photo.replace('{w}', '960')}
                srcSet={`${story.photo.replace('{w}', '480')} 480w, ${story.photo.replace('{w}', '960')} 960w`}
                sizes="(min-width: 64rem) 26rem, (min-width: 40rem) 24rem, 20rem"
                alt={story.alt}
                width={960}
                height={1446}
                className="absolute inset-0 size-full object-cover"
            />
        </div>
    );
}
