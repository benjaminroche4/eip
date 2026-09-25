import BackgroundVideo from '@/components/page/background-video';
import PageEyebrow from '@/components/page/page-eyebrow';
import ProofLine from '@/components/page/proof-line';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { ArrowUpRight, Award, EyeOff, Globe, type LucideIcon } from 'lucide-react';
import { type CSSProperties, type KeyboardEvent, type PointerEvent, type Ref, useEffect, useRef, useState } from 'react';

/** The three messages of the glass card, each with its lucide icon (user decision 2026-09-16: icons, not portraits). */
const SLIDES: { n: 1 | 2 | 3; icon: LucideIcon }[] = [
    { n: 1, icon: Award },
    { n: 2, icon: EyeOff },
    { n: 3, icon: Globe },
];

/**
 * « À propos » hero (Figma 712-23809 / 712-23841 desktop, 712-24213 / 712-24243 mobile), in the site's tone: on the
 * left, one block centred vertically in the column and aligned left on desktop, centred on mobile (user decision 2026-09-16): the header (eyebrow, h1, answer-first intro), a « Rencontrer nos conseillers » button that jumps to the team
 * section, and at the bottom the proof line (round advisor portraits, sand stars, the real Google rating and count);
 * on the right a Paris façade photo (portrait crop of the home hero photo, user decision 2026-09-16) with a dark bottom veil and, over it, a glass card (square corners) cycling three
 * messages — three small dots on its side, swipe on the card. Mobile / tablet: header centred, then the photo panel edge to edge (`-mx-6`) in 16:9 with the
 * card (user decision 2026-09-16). No autoplay (nothing moves on its own); the current message is announced via `aria-live`. The photo panel is
 * flush with the header above and the manifesto band below (no page padding, no frame) — user decision 2026-09-16.
 */
export default function AboutHero() {
    const { t } = useTranslation();
    // Reel transition (user decision 2026-09-16, same pattern as the valuation stepper): the leaving message is kept
    // in `from` while it slides out in the direction of travel (blur + fade) and the new one slides in from the other
    // side; `direction` follows the arrows / dots (next = up), wrapping included. `from` is state, not a ref.
    const [reel, setReel] = useState<{ current: number; from: number | null; direction: 'up' | 'down' }>({ current: 0, from: null, direction: 'up' });
    const current = reel.current;
    const go = (index: number, direction?: 'up' | 'down') => {
        const next = (index + SLIDES.length) % SLIDES.length;
        if (next === current) return;
        setReel({ current: next, from: current, direction: direction ?? (next > current ? 'up' : 'down') });
    };
    const settle = () => setReel((r) => (r.from === null ? r : { ...r, from: null }));
    // Under `prefers-reduced-motion` the leaving copy is `hidden` and never fires `animationend`: settle at once, or
    // `from` would stay set and the incoming message would keep its reel class forever (bug 2026-09-22).
    useEffect(() => {
        if (reel.from !== null && window.matchMedia('(prefers-reduced-motion: reduce)').matches) settle();
    }, [reel.from]);
    // The glass background follows the incoming message (user decision 2026-09-16): its height is measured
    // (ResizeObserver) and transitioned, so the card never jumps between a short and a long message.
    const currentRef = useRef<HTMLDivElement>(null);
    const [cardHeight, setCardHeight] = useState<number | null>(null);
    useEffect(() => {
        const el = currentRef.current;
        if (!el) return;
        const measure = () => setCardHeight(el.offsetHeight || null);
        measure();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [current]);
    // ↑ / ↓ move between messages when one of the dots has the focus — roving tabindex: only the current dot is in the
    // tab order and the focus follows the new message (2026-09-22: `aria-current` moved but the focus stayed behind).
    const dotsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = (current + (e.key === 'ArrowUp' ? -1 : 1) + SLIDES.length) % SLIDES.length;
            go(next, e.key === 'ArrowUp' ? 'down' : 'up');
            dotsRef.current[next]?.focus();
        }
    };
    // Swipe on the card (user decision 2026-09-16, no arrows): a vertical drag with the mouse or the finger of at least
    // 40px moves to the next message (drag up) or the previous one (drag down); the dots remain for the keyboard.
    // Compromise on touch (2026-09-22): the card is `touch-pan-y` and never calls `preventDefault`, so a finger on it
    // scrolls the page as anywhere else instead of being trapped; only a quick flick (≥ 40px in under 300 ms) that the
    // browser has not claimed for scrolling (it then fires `pointercancel`) changes the message. The dots stay the
    // reliable way to switch on touch screens.
    const TOUCH_SWIPE_MS = 300;
    const swipeStart = useRef<{ y: number; at: number; touch: boolean } | null>(null);
    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        swipeStart.current = { y: e.clientY, at: Date.now(), touch: e.pointerType === 'touch' };
        if (e.pointerType !== 'touch') {
            // Mouse / pen: no text selection while dragging, and the release is received even outside the card
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
        }
    };
    const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
        const start = swipeStart.current;
        if (start === null) return;
        const delta = start.y - e.clientY;
        swipeStart.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        if (Math.abs(delta) < 40) return;
        if (start.touch && Date.now() - start.at > TOUCH_SWIPE_MS) return;
        go(current + (delta > 0 ? 1 : -1), delta > 0 ? 'up' : 'down');
    };
    const onPointerCancel = () => {
        swipeStart.current = null;
    };
    // Mouse wheel over the card (user decision 2026-09-16): one notch down = next message, up = previous, with a
    // 600 ms cooldown so a flick moves one message only. Non-passive listener: the page must not scroll meanwhile —
    // except at the ends (2026-09-22): the wheel does not wrap around, so past the last message (or before the first)
    // the event goes through and the page scrolls on; the dots, the keyboard and the swipe keep the loop.
    const cardRef = useRef<HTMLDivElement>(null);
    const wheelLock = useRef(0);
    const goRef = useRef(go);
    goRef.current = go;
    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) < 8 || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            const next = current + (e.deltaY > 0 ? 1 : -1);
            if (next < 0 || next >= SLIDES.length) return;
            e.preventDefault();
            const now = Date.now();
            if (now - wheelLock.current < 600) return;
            wheelLock.current = now;
            goRef.current(next, e.deltaY > 0 ? 'up' : 'down');
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [current]);

    return (
        <section
            aria-labelledby="about-title"
            // Flush photo (user decision 2026-09-16): the hero cancels the layout's top padding and the gap below it, so the
            // photo panel touches the header and the manifesto band; the text column carries its own vertical padding.
            className="-mt-10 -mb-12 grid gap-10 sm:-mt-12 lg:-mt-20 lg:-mb-16 lg:grid-cols-2 lg:gap-16"
        >
            <div className="flex flex-col items-center justify-center gap-10 pt-16 text-center sm:pt-20 lg:items-start lg:py-20 lg:text-left">
                <div className="flex flex-col items-center gap-6 lg:items-start">
                    <div className="flex flex-col items-center gap-4 lg:items-start">
                        <PageEyebrow>{t('about.hero_eyebrow')}</PageEyebrow>
                        <h1 id="about-title" className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                            {t('about.headline')}
                        </h1>
                        {/* GEO: a self-contained sentence (brand + what + where) */}
                        <p className="text-muted-foreground max-w-xl text-base/7 text-pretty sm:text-sm/6">{t('pages.about.intro')}</p>
                    </div>
                    <Button asChild size="lg">
                        <a href="#team-title">
                            {t('about.hero_cta')}
                            <ArrowUpRight aria-hidden />
                        </a>
                    </Button>
                </div>

                {/* Proof line (Figma 712-23818): portraits, stars, the real Google rating — hidden without real figures (shared `ProofLine`, 2026-09-22) */}
                <ProofLine align="start" />
            </div>

            {/* Photo panel (Figma 712-23841), pushed 12px right on desktop so its edge lines up with the header's « Nous contacter » button (header inner padding 20px vs layout 32px — user decision 2026-09-16): the owner's façade clip (`public/videos/about/hero-*`, photo `hero-{800,1400}.jpg` kept as the still fallback), dark bottom veil, glass message card with its vertical controls */}
            <div className="relative -mx-6 flex aspect-video items-end overflow-hidden p-4 sm:p-6 lg:mx-0 lg:-mr-3 lg:aspect-auto lg:min-h-[46rem] lg:p-10">
                {/* The owner's portrait clip of a Haussmann façade in place of the photo (2026-09-23), decorative; the alt stays as a hidden caption */}
                <BackgroundVideo base="/videos/about/hero" widths={[640, 856]} poster="/images/about/hero-poster-856.jpg" />
                <p className="sr-only">{t('about.hero_photo_alt')}</p>
                {/* Short veil: only the height of the card, so the façade stays bright above it */}
                <div aria-hidden className="absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-black/60 to-transparent" />

                <div className="relative flex w-full items-center gap-3">
                    <div
                        aria-live="polite"
                        style={{ '--card-h': cardHeight ? `${cardHeight}px` : 'auto' } as CSSProperties}
                        ref={cardRef}
                        onPointerDown={onPointerDown}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerCancel}
                        className="grid h-(--card-h) min-w-0 flex-1 cursor-grab touch-pan-y items-start overflow-hidden bg-black/40 text-white backdrop-blur-md transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] select-none active:cursor-grabbing motion-reduce:transition-none [&>*]:[grid-area:1/1]"
                    >
                        {/* Leaving message: decorative copy sliding out, dropped once its animation ends (hidden at once under motion-reduce) */}
                        {reel.from !== null && (
                            <SlideContent
                                key={`out-${reel.from}`}
                                index={reel.from}
                                aria-hidden
                                onAnimationEnd={settle}
                                className={cn(
                                    'pointer-events-none motion-reduce:hidden',
                                    reel.direction === 'up' ? 'animate-reel-out-up' : 'animate-reel-out-down',
                                )}
                            />
                        )}
                        <SlideContent
                            key={`in-${current}`}
                            ref={currentRef}
                            index={current}
                            className={cn(
                                'motion-reduce:animate-none',
                                reel.from !== null && (reel.direction === 'up' ? 'animate-reel-in-up' : 'animate-reel-in-down'),
                            )}
                        />
                    </div>
                    {/* Switcher: three small dots only, tight (user decision 2026-09-16); arrows for the keyboard on the group */}
                    <ul role="list" aria-label={t('about.hero_slides_label')} onKeyDown={onKeyDown} className="flex shrink-0 flex-col items-center">
                        {SLIDES.map(({ n }, i) => (
                            <li key={n} className="flex">
                                <button
                                    type="button"
                                    ref={(node) => {
                                        dotsRef.current[i] = node;
                                    }}
                                    tabIndex={i === current ? 0 : -1}
                                    onClick={() => go(i)}
                                    aria-label={t('about.hero_go_to', { number: i + 1, total: SLIDES.length })}
                                    aria-current={i === current ? 'true' : undefined}
                                    className="focus-ring flex size-6 items-center justify-center"
                                >
                                    <span
                                        aria-hidden
                                        className={cn('block size-1.5 rounded-full transition-colors', i === current ? 'bg-white' : 'bg-white/40')}
                                    />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}

type SlideContentProps = {
    index: number;
    className?: string;
    'aria-hidden'?: boolean;
    onAnimationEnd?: () => void;
    ref?: Ref<HTMLDivElement>;
};

/** One message of the glass card: icon tile, eyebrow, h2 and text — rendered twice during a reel transition. */
function SlideContent({ index, className, onAnimationEnd, ref, ...props }: SlideContentProps) {
    const { t } = useTranslation();
    const { n: slide, icon: SlideIcon } = SLIDES[index];
    return (
        <div {...props} ref={ref} onAnimationEnd={onAnimationEnd} className={cn('flex min-w-0 items-start gap-3 p-3 sm:gap-4 sm:p-4', className)}>
            <span className="flex size-11 shrink-0 items-center justify-center bg-white/10 sm:size-14">
                <SlideIcon aria-hidden className="size-5 sm:size-6" strokeWidth={1.5} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
                <p className="text-[0.625rem] font-medium tracking-wider text-white/80 uppercase">{t(`about.hero_slide_${slide}_eyebrow`)}</p>
                <h2 className="font-sans text-sm font-medium">{t(`about.hero_slide_${slide}_title`)}</h2>
                <p className="line-clamp-2 text-xs text-white/70 sm:line-clamp-none">{t(`about.hero_slide_${slide}_text`)}</p>
            </div>
        </div>
    );
}
