import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { useTranslation } from '@/hooks/use-translation';
import { scrollBehavior } from '@/lib/focus-field';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { type KeyboardEvent, type MouseEvent, type PointerEvent, useEffect, useRef, useState } from 'react';

type PropertyGalleryProps = {
    /** `{w}` templates, 400 / 800 / 1200 / 1600 available. */
    photos: string[];
    alt: string;
    title: string;
};

/**
 * Gallery of the detail page (user decision 2026-09-29, replacing the hero + thumbnails of the day before): **every
 * photo on one line that scrolls**, a film strip edge to edge under the header, 50 dvh high (a notch smaller, user decision 2026-09-29), each photo at the row's
 * height and its own width, a 12px gap and the page's side margins at both ends (user decision 2026-09-29), snap on each, mouse / pen drag (`useDragScroll`), arrows always shown that **wrap around**
 * (last → first, user decision 2026-09-29: an arrow must never fade at the ends), counter « 2 / 5 », the first photo eager (LCP); a click on a photo (not the end of a drag) or « Voir les N photos » opens the **modal carousel**
 * (user decision 2026-09-29): the photo large, the thumbnails under it, arrows, ← →, swipe, a click on the dark backdrop closes; the backdrop is translucent
 * (`bg-primary/80` + blur, the page shows through — user decision 2026-09-29). The « Visite 3D » link and the « Visite vidéo » button were removed on 2026-09-29 (user decisions). The lightbox is a full-screen dark dialog: the photo contained, previous / next arrows (and ← →), the
 * counter announced, a strip of thumbnails (`aria-pressed`), Escape / the cross close it and the focus returns to
 * the tile. A single photo shows alone, without button.
 */
export default function PropertyGallery({ photos, alt, title }: PropertyGalleryProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState<number | null>(null);
    // The tile or button that opened the lightbox: the focus goes back to it on close (the dialog is controlled, no trigger)
    const opener = useRef<HTMLElement | null>(null);
    const openAt = (e: MouseEvent<HTMLButtonElement>, i: number) => {
        opener.current = e.currentTarget;
        setOpen(i);
    };
    const count = photos.length;
    const src = (photo: string, w: 400 | 800 | 1200 | 1600) => photo.replace('{w}', String(w));
    const srcSet = (photo: string) => ([400, 800, 1200, 1600] as const).map((w) => `${src(photo, w)} ${w}w`).join(', ');
    // Swipe in the lightbox (2026-09-28): a horizontal pointer drag of 40px or more changes the photo
    const swipe = useRef<number | null>(null);
    // A press on a strip photo. With the mouse, `useDragScroll` captures the pointer on the strip, so the click never
    // reaches the photo's button: the release on the strip opens the modal instead (unless the pointer moved 8px or
    // more: a drag). Touch scrolls natively and keeps its click; the keyboard's click has no press at all.
    const pressed = useRef<{ i: number; x: number; type: string; el: HTMLElement } | null>(null);
    const release = (e: PointerEvent<HTMLElement>) => {
        const press = pressed.current;
        if (!press || press.type === 'touch' || !strip.current?.dataset.dragging) return;
        pressed.current = null;
        if (Math.abs(e.clientX - press.x) >= 8) return;
        opener.current = press.el;
        setOpen(press.i);
    };
    // The strip: drag with the mouse (touch scrolls natively), the shown photo measured on the scroll for the arrows
    const strip = useRef<HTMLUListElement>(null);
    const [index, setIndex] = useState(0);
    useDragScroll(strip, { align: 'start', open: 'first' });
    useEffect(() => {
        const el = strip.current;
        if (!el || count < 2) return;
        const measure = () => {
            const items = Array.from(el.children) as HTMLElement[];
            const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
            let nearest = 0;
            items.forEach((item, i) => {
                if (Math.abs(item.offsetLeft - el.scrollLeft) < Math.abs(items[nearest].offsetLeft - el.scrollLeft)) nearest = i;
            });
            setIndex(atEnd ? count - 1 : nearest);
        };
        el.addEventListener('scroll', measure, { passive: true });
        return () => el.removeEventListener('scroll', measure);
    }, [count]);
    const slide = (to: number) => {
        const el = strip.current;
        const item = el?.children[Math.min(Math.max(to, 0), count - 1)] as HTMLElement | undefined;
        if (el && item) el.scrollTo({ left: item.offsetLeft, behavior: scrollBehavior() });
    };
    // Under sm the two arrows sit side by side at the bottom right of the strip (user decision 2026-09-29, they were hidden on mobile); from sm, centred on the sides
    const arrowClass =
        'focus-ring bg-card/80 text-foreground hover:bg-card absolute flex size-10 items-center justify-center backdrop-blur transition-colors duration-300 sm:top-1/2 sm:-translate-y-1/2 motion-reduce:transition-none';
    const altOf = (i: number) => (i === 0 ? alt : t('properties.photo_n', { alt, n: i + 1, count }));
    const go = (delta: number) => setOpen((i) => (i === null ? null : (i + delta + count) % count));
    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
    };

    return (
        <div
            role="group"
            aria-roledescription="carousel"
            aria-label={t('properties.photos_label', { title })}
            className="group/strip relative left-1/2 -mt-10 w-screen -translate-x-1/2 sm:-mt-12 lg:-mt-20"
        >
            {/* Every photo on one line that scrolls (user decision 2026-09-29): a film strip edge to edge under the header,
                each photo at the row's height, snap on each, mouse / pen drag, arrows on hover, the first one eager (LCP) */}
            <ul
                ref={strip}
                onPointerUp={release}
                role="list"
                className="flex h-[50dvh] max-h-[36rem] min-h-72 cursor-grab snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto overscroll-x-contain px-6 select-none [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
            >
                {photos.map((photo, i) => (
                    <li key={photo} className="h-full shrink-0 snap-start last:snap-end">
                        {/* A click opens the modal at this photo (user decision 2026-09-29): the carousel with the thumbnails under
                            the main photo; a click that ends a drag of the strip (8px or more) is not one */}
                        <button
                            type="button"
                            onPointerDown={(e) => (pressed.current = { i, x: e.clientX, type: e.pointerType, el: e.currentTarget })}
                            onClick={(e) => {
                                const press = pressed.current;
                                pressed.current = null;
                                if (press && Math.abs(e.clientX - press.x) >= 8) return;
                                openAt(e, i);
                            }}
                            aria-label={t('property.gallery_open_n', { n: i + 1, count })}
                            className="focus-ring bg-background-05 block h-full overflow-hidden"
                        >
                            <SeoImage
                                src={src(photo, 1600)}
                                srcSet={srcSet(photo)}
                                sizes="(min-width: 1024px) 60vw, 90vw"
                                alt={altOf(i)}
                                width={1600}
                                height={1067}
                                priority={i === 0}
                                draggable={false}
                                className="h-full w-auto max-w-none object-cover"
                            />
                        </button>
                    </li>
                ))}
            </ul>
            {count > 1 && (
                <>
                    <button
                        type="button"
                        aria-label={t('properties.photo_prev')}
                        onClick={() => slide(index === 0 ? count - 1 : index - 1)}
                        className={cn(arrowClass, 'right-17 bottom-4 sm:right-auto sm:bottom-auto sm:left-4 lg:left-6')}
                    >
                        <ChevronLeft aria-hidden className="size-5" strokeWidth={1.5} />
                    </button>
                    <button
                        type="button"
                        aria-label={t('properties.photo_next')}
                        onClick={() => slide(index === count - 1 ? 0 : index + 1)}
                        className={cn(arrowClass, 'right-6 bottom-4 sm:right-4 sm:bottom-auto lg:right-6')}
                    >
                        <ChevronRight aria-hidden className="size-5" strokeWidth={1.5} />
                    </button>
                    <p className="sr-only" aria-live="polite">
                        {t('properties.photo_count', { n: index + 1, count })}
                    </p>
                </>
            )}
            <div className="absolute top-4 right-6 flex flex-wrap justify-end gap-2 lg:right-8">
                {count > 1 && (
                    <span
                        aria-hidden
                        className="bg-card/80 text-foreground flex h-8 items-center px-2.5 text-xs font-medium tabular-nums backdrop-blur"
                    >
                        {index + 1} / {count}
                    </span>
                )}
                {count > 1 && (
                    <Button type="button" variant="neutral" size="sm" onClick={(e) => openAt(e, 0)}>
                        <Images aria-hidden strokeWidth={1.5} />
                        {t('property.gallery_open', { count })}
                    </Button>
                )}
            </div>

            <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
                <DialogContent
                    showCloseButton={false}
                    onKeyDown={onKeyDown}
                    onCloseAutoFocus={(e) => {
                        e.preventDefault();
                        opener.current?.focus();
                    }}
                    className="bg-primary/80 text-primary-foreground flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-0 p-0 shadow-none backdrop-blur-md sm:max-w-none"
                >
                    <DialogTitle className="sr-only">{t('properties.photos_label', { title })}</DialogTitle>
                    <DialogDescription className="sr-only">{t('property.gallery_help')}</DialogDescription>
                    <div className="flex items-center justify-between gap-4 p-4">
                        <p aria-live="polite" className="text-sm tabular-nums">
                            {open !== null && t('properties.photo_count', { n: open + 1, count })}
                        </p>
                        <Button type="button" variant="neutral" size="icon" onClick={() => setOpen(null)} aria-label={t('property.gallery_close')}>
                            <X aria-hidden />
                        </Button>
                    </div>
                    <div
                        className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16"
                        onClick={(e) => e.target === e.currentTarget && setOpen(null)}
                        onPointerDown={(e) => (swipe.current = e.clientX)}
                        onPointerUp={(e) => {
                            if (swipe.current === null) return;
                            const dx = e.clientX - swipe.current;
                            swipe.current = null;
                            if (Math.abs(dx) >= 40) go(dx < 0 ? 1 : -1);
                        }}
                    >
                        {open !== null && (
                            <img
                                key={photos[open]}
                                src={src(photos[open], 1600)}
                                alt={altOf(open)}
                                width={1600}
                                height={1067}
                                draggable={false}
                                className="animate-fade-in max-h-full max-w-full touch-pan-y object-contain select-none motion-reduce:animate-none"
                            />
                        )}
                        {count > 1 && (
                            <>
                                <Button
                                    type="button"
                                    variant="neutral"
                                    size="icon"
                                    onClick={() => go(-1)}
                                    aria-label={t('property.gallery_prev')}
                                    className="group absolute left-2 active:scale-90 sm:left-4"
                                >
                                    <ChevronLeft aria-hidden className="transition-transform group-active:-translate-x-0.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="neutral"
                                    size="icon"
                                    onClick={() => go(1)}
                                    aria-label={t('property.gallery_next')}
                                    className="group absolute right-2 active:scale-90 sm:right-4"
                                >
                                    <ChevronRight aria-hidden className="transition-transform group-active:translate-x-0.5" />
                                </Button>
                            </>
                        )}
                    </div>
                    {count > 1 && (
                        <ul
                            role="list"
                            className="flex justify-center gap-2 overflow-x-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {photos.map((photo, i) => (
                                <li key={photo} className="shrink-0">
                                    <button
                                        type="button"
                                        aria-pressed={i === open}
                                        aria-label={t('property.gallery_thumb', { n: i + 1 })}
                                        onClick={() => setOpen(i)}
                                        className={cn(
                                            'focus-ring block overflow-hidden border-2 transition-colors duration-300 motion-reduce:transition-none',
                                            i === open ? 'border-secondary-60' : 'border-transparent opacity-60 hover:opacity-100',
                                        )}
                                    >
                                        <img
                                            src={src(photo, 800)}
                                            alt=""
                                            width={800}
                                            height={600}
                                            loading="lazy"
                                            className="aspect-[4/3] w-20 object-cover"
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
