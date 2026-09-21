import PageEyebrow from '@/components/page/page-eyebrow';
import SeoImage from '@/components/seo/seo-image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ArrowUpRight, Award, EyeOff, Globe, type LucideIcon, Star } from 'lucide-react';
import { type CSSProperties, type KeyboardEvent, type PointerEvent, type Ref, useEffect, useRef, useState } from 'react';

/** Advisor portraits (public/images/advisors), the same trio as the footer and the CTA card. */
const ADVISORS = [
    { id: 1, initials: 'AB' },
    { id: 2, initials: 'CD' },
    { id: 3, initials: 'EF' },
] as const;

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
    const { t, tc } = useTranslation();
    const { seo } = usePage<SharedData>().props;
    const reviews = seo.reviews;
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
    // ↑ / ↓ move between messages when one of the controls has the focus
    const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            go(current + (e.key === 'ArrowUp' ? -1 : 1), e.key === 'ArrowUp' ? 'down' : 'up');
        }
    };
    // Swipe on the card (user decision 2026-09-16, no arrows): a vertical drag with the mouse or the finger of at least
    // 40px moves to the next message (drag up) or the previous one (drag down); the dots remain for the keyboard.
    const swipeStart = useRef<number | null>(null);
    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        swipeStart.current = e.clientY;
        if (e.pointerType !== 'touch') {
            // Mouse / pen: no text selection while dragging, and the release is received even outside the card
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
        }
    };
    const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
        if (swipeStart.current === null) return;
        const delta = swipeStart.current - e.clientY;
        swipeStart.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        if (Math.abs(delta) < 40) return;
        go(current + (delta > 0 ? 1 : -1), delta > 0 ? 'up' : 'down');
    };
    const onPointerCancel = () => {
        swipeStart.current = null;
    };
    // Mouse wheel over the card (user decision 2026-09-16): one notch down = next message, up = previous, with a
    // 600 ms cooldown so a flick moves one message only. Non-passive listener: the page must not scroll meanwhile.
    const cardRef = useRef<HTMLDivElement>(null);
    const wheelLock = useRef(0);
    const goRef = useRef(go);
    goRef.current = go;
    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) < 8 || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            e.preventDefault();
            const now = Date.now();
            if (now - wheelLock.current < 600) return;
            wheelLock.current = now;
            goRef.current(current + (e.deltaY > 0 ? 1 : -1), e.deltaY > 0 ? 'up' : 'down');
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [current]);

    return (
        <section
            aria-labelledby="about-title"
            // Flush photo (user decision 2026-09-16): the hero cancels the layout's top padding and the gap below it, so the
            // photo panel touches the header and the manifesto band; the text column carries its own vertical padding.
            className="-mt-16 -mb-12 grid gap-10 sm:-mt-20 lg:-mb-16 lg:grid-cols-2 lg:gap-16"
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

                {/* Proof line (Figma 712-23818): portraits, stars, the real Google rating — hidden without real figures */}
                {reviews && (
                    <div className="flex flex-col">
                        <div className="flex items-center justify-center gap-4 lg:justify-start">
                            <ul role="list" aria-label={t('footer.advisors')} className="flex -space-x-3">
                                {ADVISORS.map((a) => (
                                    <li key={a.id}>
                                        <Avatar className="ring-card size-11 ring-2">
                                            <AvatarImage src={`/images/advisors/advisor-${a.id}.webp`} alt="" loading="lazy" />
                                            <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">
                                                {a.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex flex-col items-start gap-1">
                                <span aria-hidden className="text-secondary-60 flex items-center gap-1">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <Star key={i} className="size-4 fill-current" strokeWidth={0} />
                                    ))}
                                </span>
                                <p className="text-muted-foreground text-sm">
                                    <span className="text-foreground font-semibold tabular-nums">{reviews.rating.toLocaleString('fr-FR')}/5</span>{' '}
                                    {tc('testimonials.based_on', reviews.count, { count: reviews.count.toLocaleString('fr-FR') })} Google
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Photo panel (Figma 712-23841), pushed 12px right on desktop so its edge lines up with the header's « Nous contacter » button (header inner padding 20px vs layout 32px — user decision 2026-09-16): team photo, dark bottom veil, glass message card with its vertical controls */}
            <div className="relative -mx-6 flex aspect-video items-end overflow-hidden p-4 sm:p-6 lg:mx-0 lg:-mr-3 lg:aspect-auto lg:min-h-[46rem] lg:p-10">
                <SeoImage
                    src="/images/about/hero-1400.jpg"
                    srcSet="/images/about/hero-800.jpg 800w, /images/about/hero-1400.jpg 1400w"
                    sizes="(min-width: 64rem) 50vw, 100vw"
                    alt={t('about.hero_photo_alt')}
                    width={1400}
                    height={1751}
                    priority
                    className="animate-hero-photo absolute inset-0 size-full object-cover motion-reduce:animate-none"
                />
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
                        className="grid h-(--card-h) min-w-0 flex-1 cursor-grab touch-pan-x items-start overflow-hidden bg-black/40 text-white backdrop-blur-md transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] select-none active:cursor-grabbing motion-reduce:transition-none [&>*]:[grid-area:1/1]"
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
