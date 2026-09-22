import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { useReveal } from '@/hooks/use-reveal';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type CSSProperties, Fragment, useEffect, useRef, useState } from 'react';

export type SuccessStory = { title: string; place: string; duration: string; result: string; photo: string; alt: string };

type SuccessStoriesProps = {
    stories: SuccessStory[];
    /** Home: the quote + blog button under the photos. Sell (2026-09-22) passes `false`: photos and arrows only. */
    quote?: boolean;
    /** Inside a page that already has the layout's gutters and section gaps (Sell): no own padding. */
    embedded?: boolean;
};

/** Same press feedback as the other carousels' arrows. */
const arrowClass = 'group transition-transform active:scale-90 motion-reduce:transition-none';

/**
 * « Success stories » (Figma 712-25407 desktop / 712-25844 mobile): photos only (user decision 2026-09-22 — the
 * eyebrow / title / place · duration · result overlay was removed, the story stays in the `alt`), one horizontal
 * snap row at every width, photos in the former card format (`w-80 sm:w-96 lg:w-104`, `h-96 sm:h-112 lg:h-120`), one centred at a time below `lg` and a row starting at the left edge from `lg` (`snap-start`), draggable with the mouse or the finger (`useDragScroll`)
 * with previous / next arrows under the row; then a centred Montserrat quote written word by word when it enters
 * the viewport (the about manifesto's reveal) and one button to the blog, where the case studies live. Also used on « Vendre » (2026-09-22) with `quote={false}`
 * and `embedded` in place of the former photo mosaic.
 */
export default function SuccessStories({ stories, quote = true, embedded = false }: SuccessStoriesProps) {
    const { t } = useTranslation();
    const rowRef = useRef<HTMLUListElement>(null);
    const [current, setCurrent] = useState(0);
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

    useEffect(() => {
        const el = rowRef.current;
        if (!el) return;
        const onScroll = () => {
            const cards = Array.from(el.children) as HTMLElement[];
            const start = window.matchMedia('(min-width: 64rem)').matches;
            const reference = start ? el.scrollLeft : el.scrollLeft + el.clientWidth / 2;
            const distance = (card: HTMLElement) => Math.abs((start ? card.offsetLeft : card.offsetLeft + card.offsetWidth / 2) - reference);
            let best = 0;
            cards.forEach((card, i) => {
                if (distance(card) < distance(cards[best])) best = i;
            });
            setCurrent(best);
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    const goTo = (index: number) => {
        const el = rowRef.current;
        const card = el?.children[index] as HTMLElement | undefined;
        if (!el || !card) return;
        const start = window.matchMedia('(min-width: 64rem)').matches;
        el.scrollTo({
            left: start ? card.offsetLeft : card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    };

    return (
        <section
            aria-labelledby="stories-title"
            className={cn('flex flex-col gap-10 lg:gap-14', !embedded && 'mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8')}
        >
            <h2 id="stories-title" className="sr-only">
                {t('stories.title')}
            </h2>
            <div className="flex flex-col items-center gap-6">
                <ul
                    ref={rowRef}
                    role="list"
                    className="-mx-6 flex w-[calc(100%+3rem)] cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto px-[calc(50%-10rem)] pb-1 select-none [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none sm:px-[calc(50%-12rem)] lg:mx-0 lg:w-full lg:px-0 [&::-webkit-scrollbar]:hidden"
                >
                    {stories.map((story) => (
                        <li key={story.title} className="w-80 shrink-0 snap-center sm:w-96 lg:w-104 lg:snap-start">
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
                        disabled={current === 0}
                        onClick={() => goTo(current - 1)}
                    >
                        <ChevronLeft aria-hidden className="transition-transform group-active:-translate-x-0.5 motion-reduce:transition-none" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={arrowClass}
                        aria-label={t('stories.next')}
                        disabled={current === stories.length - 1}
                        onClick={() => goTo(current + 1)}
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

/** One photo: bare, square corners, no veil, no text — the story is in the `alt`. */
function StoryPhoto({ story }: { story: SuccessStory }) {
    return (
        <div className="relative h-96 overflow-hidden sm:h-112 lg:h-120">
            <SeoImage
                src={story.photo.replace('{w}', '1600')}
                srcSet={`${story.photo.replace('{w}', '800')} 800w, ${story.photo.replace('{w}', '1600')} 1600w`}
                sizes="(min-width: 64rem) 26rem, (min-width: 40rem) 24rem, 20rem"
                alt={story.alt}
                width={1600}
                height={1067}
                className="absolute inset-0 size-full object-cover"
            />
        </div>
    );
}
