import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Building2, type LucideIcon, MessageCircleQuestion, Navigation } from 'lucide-react';
import { type CSSProperties, useRef } from 'react';

/** The three trust items at the bottom of the hero (Figma 712-26763), icons matched to the Figma glyphs. */
const VALUES: { key: 'hero_value_1' | 'hero_value_2' | 'hero_value_3'; icon: LucideIcon }[] = [
    { key: 'hero_value_1', icon: Building2 },
    { key: 'hero_value_2', icon: Navigation },
    { key: 'hero_value_3', icon: MessageCircleQuestion },
];

/**
 * Home hero (Figma 712-26754): fills the first screen (`min-h-svh`), full-width photo running behind the sticky header
 * (pulled up by the header's height, `PublicLayout hero` + `SiteHeader overlay`), revealed on load (photo settles from a
 * 1.05 zoom, then eyebrow / title / text / button / trust row rise in cascade — `motion-reduce` cancels), 30 % dark veil + bottom-up black gradient, everything centred — uppercase eyebrow, bold Montserrat
 * headline on two lines, answer-first sentence (GEO), white « Contacter un conseiller » button — and the three trust
 * items with icons and hairline separators along the bottom edge.
 */
export default function Hero() {
    const { t } = useTranslation();
    const row = useRef<HTMLUListElement>(null);
    // Mobile: the trust row is a snap carousel — opens on the middle item, a light swipe / wheel moves to the next item
    // and locks it centred, the mouse can drag it too (user decisions 2026-09-16).
    useDragScroll(row);

    return (
        <section
            aria-labelledby="hero-title"
            className="relative -mt-16 flex min-h-svh flex-col justify-between overflow-hidden text-white lg:-mt-19"
        >
            <SeoImage
                priority
                src="/images/home/hero-1200.jpg"
                srcSet="/images/home/hero-800.jpg 800w, /images/home/hero-1200.jpg 1200w, /images/home/hero-2000.jpg 2000w, /images/home/hero-2800.jpg 2800w"
                sizes="100vw"
                alt=""
                width={2800}
                height={1776}
                className="animate-hero-photo absolute inset-0 size-full object-cover motion-reduce:animate-none"
            />
            <div aria-hidden className="absolute inset-0 bg-black/30" />
            {/* Extra darkening behind the central block only (transparent at the edges), so the text stays legible on a bright sky */}
            <div aria-hidden className="absolute inset-0 bg-linear-to-b from-transparent via-black/45 to-transparent" />
            <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black via-black/0 via-30% to-transparent" />

            <HeroContent />

            {/* Trust row (Figma 712-26763): one line with hairline separators at every width — on mobile it scrolls sideways
                (snap carousel centred on each item, draggable, hidden scrollbar) instead of stacking (user decisions 2026-09-16). */}
            <ul
                ref={row}
                role="list"
                aria-label={t('home.values_label')}
                style={rise(4).style}
                className={cn(
                    // Mobile: 40vw side padding lets the first / last item sit in the middle when snapped; snap is suspended while dragging.
                    'relative flex w-full cursor-grab snap-x snap-mandatory items-center gap-6 overflow-x-auto px-[40vw] pb-8 text-white/90 select-none [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none sm:cursor-auto sm:snap-none sm:justify-center sm:gap-8 sm:overflow-visible sm:px-6 sm:select-auto lg:gap-14 [&::-webkit-scrollbar]:hidden',
                    rise(4).className,
                )}
            >
                {VALUES.map(({ key, icon: Icon }, index) => (
                    <li key={key} className="flex shrink-0 snap-center items-center gap-6 whitespace-nowrap sm:gap-8 lg:gap-14">
                        {/* Site-style separator: vertical hairline fading at both ends (GradientHairline, in white) */}
                        {index > 0 && <span aria-hidden className="block h-6 w-px bg-linear-to-b from-transparent via-white/60 to-transparent" />}
                        <span className="flex items-center gap-3">
                            <Icon aria-hidden className="size-5 shrink-0" strokeWidth={1.5} />
                            <span className="text-base/7 sm:text-sm/6">{t(`home.${key}`)}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

/** Cascade step for the reveal: the tolerated dynamic CSS variable feeds `animation-delay`. */
export const rise = (step: number): { className: string; style: CSSProperties } => ({
    className: 'animate-hero-rise [animation-delay:var(--stagger)] motion-reduce:animate-none',
    style: { '--stagger': `${300 + step * 120}ms` } as CSSProperties,
});

/**
 * Central block (user decision 2026-09-16, ui.sh variant « Surtitre avec traits »): eyebrow framed by two short white
 * rules, bold Montserrat title on two lines, one short answer-first sentence (GEO), white button.
 */
function HeroContent() {
    const { t } = useTranslation();

    return (
        <div className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 pt-36 pb-20 text-center sm:px-10 lg:pt-44 lg:pb-24">
            <div className="flex max-w-3xl flex-col items-center gap-4">
                <p
                    style={rise(0).style}
                    className={cn(
                        'flex items-center gap-3 text-xs font-medium tracking-wider text-white/90 uppercase drop-shadow-sm sm:text-sm',
                        rise(0).className,
                    )}
                >
                    <span aria-hidden className="h-px w-8 bg-white/50" />
                    {t('home.hero_eyebrow')}
                    <span aria-hidden className="h-px w-8 bg-white/50" />
                </p>
                <h1
                    id="hero-title"
                    style={rise(1).style}
                    className={cn('font-heading text-3xl font-bold text-balance drop-shadow-md sm:text-4xl lg:text-5xl', rise(1).className)}
                >
                    {t('home.hero_title_1')}
                    <br />
                    {t('home.hero_title_2')}
                </h1>
                {/* GEO: the first paragraph under the h1 is a self-contained, citable sentence (brand + subject + place). */}
                <p
                    style={rise(2).style}
                    className={cn('max-w-2xl text-base/7 font-medium text-pretty text-white drop-shadow-sm sm:text-lg/8', rise(2).className)}
                >
                    {t('home.hero_text')}
                </p>
            </div>
            <Button asChild variant="neutral" size="lg" style={rise(3).style} className={cn('w-full sm:w-auto', rise(3).className)}>
                <Link href={route('contact')} prefetch>
                    {t('home.hero_cta')}
                </Link>
            </Button>
        </div>
    );
}
