import SeoImage from '@/components/seo/seo-image';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { useTranslation } from '@/hooks/use-translation';
import { scrollBehavior } from '@/lib/focus-field';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type PropertyPhotosProps = {
    photos: string[];
    alt: string;
    title: string;
    /** No row of dots (confidential cards: the photos are blurred, user decision 2026-09-28). */ dots?: boolean;
    /** Card above the fold: its first photo loads eagerly with high priority (LCP), the others stay lazy (2026-09-28). */
    priority?: boolean;
};

const arrowClass =
    'focus-ring bg-card/60 text-foreground hover:bg-card/90 absolute top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-none transition-[opacity,background-color] duration-300 group-hover/photos:opacity-70 hover:opacity-100 focus-visible:opacity-100 aria-disabled:cursor-default aria-disabled:opacity-0 motion-reduce:transition-none lg:opacity-0';

/**
 * The photos of a property card scroll one by one (user decision 2026-09-25): a `snap-x` row swiped on touch, arrows
 * from `sm` (shown on hover / focus on desktop, always on touch screens), a row of dots. Arrows and dots are measured
 * on the scroll position, never on an index (a11y rule), an arrow at the end is `aria-disabled` (focus stays), every
 * scroll goes through `scrollBehavior()`. The mouse drags the row too (`useDragScroll`, grab cursor) and the dots sit on
 * a translucent dark pill so they read on any photo (user decisions 2026-09-26). A single photo renders the image alone.
 */
export default function PropertyPhotos({ photos, alt, title, dots = true, priority = false }: PropertyPhotosProps) {
    const { t } = useTranslation();
    const ref = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);
    const count = photos.length;
    // Mouse / pen drag (touch scrolls natively), snap to photo starts, release on the nearest one (user decision 2026-09-26)
    useDragScroll(ref, { align: 'start', open: 'first' });

    useEffect(() => {
        const el = ref.current;
        if (!el || count < 2) return;
        const measure = () => setIndex(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
        el.addEventListener('scroll', measure, { passive: true });
        return () => el.removeEventListener('scroll', measure);
    }, [count]);

    const go = (to: number) => {
        const el = ref.current;
        if (!el) return;
        const next = Math.min(Math.max(to, 0), count - 1);
        el.scrollTo({ left: next * el.clientWidth, behavior: scrollBehavior() });
    };

    // Each slide clips its image so the hover zoom (the card is the `group`) never bleeds into the next photo
    const image = (src: string, i: number) => (
        <div key={src + i} className="w-full shrink-0 snap-start overflow-hidden last:snap-end">
            <SeoImage
                src={src.replace('{w}', '1600')}
                srcSet={`${src.replace('{w}', '800')} 800w, ${src.replace('{w}', '1600')} 1600w`}
                sizes="(min-width: 64rem) 24rem, (min-width: 40rem) 50vw, 100vw"
                alt={count > 1 ? t('properties.photo_n', { alt, n: i + 1, count }) : alt}
                width={1600}
                height={1200}
                priority={priority && i === 0}
                className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
            />
        </div>
    );

    if (count < 2) return image(photos[0], 0);

    return (
        <div
            className="group/photos relative overflow-hidden"
            role="group"
            aria-roledescription="carousel"
            aria-label={t('properties.photos_label', { title })}
        >
            <div
                ref={ref}
                className="flex cursor-grab snap-x snap-mandatory overflow-x-auto overscroll-x-contain select-none [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none [&::-webkit-scrollbar]:hidden"
            >
                {photos.map(image)}
            </div>
            <button
                type="button"
                aria-label={t('properties.photo_prev')}
                aria-disabled={index === 0 || undefined}
                onClick={() => index > 0 && go(index - 1)}
                className={cn(arrowClass, 'left-2')}
            >
                <ChevronLeft aria-hidden className="size-4" strokeWidth={1.5} />
            </button>
            <button
                type="button"
                aria-label={t('properties.photo_next')}
                aria-disabled={index === count - 1 || undefined}
                onClick={() => index < count - 1 && go(index + 1)}
                className={cn(arrowClass, 'right-2')}
            >
                <ChevronRight aria-hidden className="size-4" strokeWidth={1.5} />
            </button>
            {dots && (
                <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
                    <div className="flex gap-1.5 rounded-full bg-black/30 px-2 py-1.5">
                        {photos.map((src, i) => (
                            <span
                                key={src + i}
                                className={cn(
                                    'size-1.5 rounded-full transition-colors duration-300 motion-reduce:transition-none',
                                    i === index ? 'bg-card' : 'bg-card/50',
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}
            <p className="sr-only" aria-live="polite">
                {t('properties.photo_count', { n: index + 1, count })}
            </p>
        </div>
    );
}
