import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { useReveal } from '@/hooks/use-reveal';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, TrendingUp } from 'lucide-react';
import { type CSSProperties, Fragment, useEffect, useRef, useState } from 'react';

export type SuccessStory = { title: string; place: string; duration: string; result: string; photo: string; alt: string };

type SuccessStoriesProps = { stories: SuccessStory[] };

/** Same press feedback as the other carousels' arrows. */
const arrowClass = 'group transition-transform active:scale-90 motion-reduce:transition-none';

/**
 * « Success stories » (Figma 712-25407 desktop / 712-25844 mobile), in the site's tone: photo cards with square
 * corners, a black bottom veil and the story over it (eyebrow, Montserrat title, place · duration · result with lucide
 * icons); the first card takes two thirds of the row on desktop; then a centred Montserrat quote written word by word when it enters the viewport (the about manifesto's reveal) and one button to the
 * blog, where the case studies live (no dedicated page yet). Mobile / tablet: one centred card at a time, draggable
 * with the mouse, previous / next arrows (the pattern of the services and team rows). Figures must be real ones.
 */
export default function SuccessStories({ stories }: SuccessStoriesProps) {
    const { t } = useTranslation();
    const rowRef = useRef<HTMLUListElement>(null);
    const [current, setCurrent] = useState(0);
    const quoteRef = useRef<HTMLDivElement>(null);
    const revealed = useReveal(quoteRef, '-15%');

    // The quote is written word by word when it enters the viewport, the same reveal as the about manifesto
    const WORD_MS = 40;
    const animClass = revealed
        ? 'animate-manifesto-in [animation-delay:var(--stagger)] motion-reduce:animate-none'
        : 'opacity-0 motion-reduce:opacity-100';
    const quoteWords = t('stories.quote').split(' ');
    useDragScroll(rowRef, { align: 'center', open: 'first' });

    useEffect(() => {
        const el = rowRef.current;
        if (!el) return;
        const onScroll = () => {
            const cards = Array.from(el.children) as HTMLElement[];
            const centre = el.scrollLeft + el.clientWidth / 2;
            const distance = (card: HTMLElement) => Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre);
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
        el.scrollTo({
            left: card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    };

    return (
        <section aria-labelledby="stories-title" className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 sm:py-20 lg:gap-14 lg:px-8">
            <h2 id="stories-title" className="sr-only">
                {t('stories.title')}
            </h2>
            <div className="flex flex-col items-center gap-6">
                <ul
                    ref={rowRef}
                    role="list"
                    className="-mx-6 flex w-[calc(100%+3rem)] cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto px-[calc(50%-10rem)] pb-1 select-none [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none sm:px-[calc(50%-12rem)] lg:mx-0 lg:grid lg:w-full lg:cursor-auto lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:select-auto [&::-webkit-scrollbar]:hidden"
                >
                    {stories.map((story, i) => (
                        <li key={story.title} className={cn('w-80 shrink-0 snap-center sm:w-96 lg:w-auto', i === 0 && 'lg:col-span-2')}>
                            <StoryCard story={story} eyebrow={t('stories.eyebrow')} large={i === 0} />
                        </li>
                    ))}
                </ul>
                <div className="flex items-center gap-2 lg:hidden">
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
                <Button asChild size="lg" style={{ '--stagger': `${quoteWords.length * WORD_MS + 100}ms` } as CSSProperties} className={animClass}>
                    <Link href={route('blog.index')} prefetch>
                        {t('stories.cta')}
                    </Link>
                </Button>
            </div>
        </section>
    );
}

type StoryCardProps = { story: SuccessStory; eyebrow: string; large: boolean };

/** One story: photo, black bottom veil, eyebrow + title + place · duration · result. Square corners, no shadow. */
function StoryCard({ story, eyebrow, large }: StoryCardProps) {
    const meta: { icon: typeof MapPin; text: string }[] = [
        { icon: MapPin, text: story.place },
        { icon: CalendarDays, text: story.duration },
        { icon: TrendingUp, text: story.result },
    ];
    return (
        <article className="relative flex h-96 items-end overflow-hidden p-5 text-white sm:h-112 lg:h-120 lg:p-7">
            <SeoImage
                src={story.photo.replace('{w}', '1600')}
                srcSet={`${story.photo.replace('{w}', '800')} 800w, ${story.photo.replace('{w}', '1600')} 1600w`}
                sizes={large ? '(min-width: 64rem) 66vw, 100vw' : '(min-width: 64rem) 33vw, 100vw'}
                alt={story.alt}
                width={1600}
                height={1067}
                className="absolute inset-0 size-full object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black via-black/40 via-45% to-transparent" />
            <div className="relative flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium tracking-wider text-white/80 uppercase">{eyebrow}</p>
                    <h3 className={cn('font-heading font-medium text-balance', large ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl')}>
                        {story.title}
                    </h3>
                </div>
                <ul role="list" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/70">
                    {meta.map(({ icon: Icon, text }, i) => (
                        <li key={text} className="flex items-center gap-2">
                            {i > 0 && <span aria-hidden className="mr-0 size-1 rounded-full bg-white/50" />}
                            <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.5} />
                            {text}
                        </li>
                    ))}
                </ul>
            </div>
        </article>
    );
}
