import HeroSearch from '@/components/home/hero-search';
import HeroVideo from '@/components/home/hero-video';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Building2, type LucideIcon, MessageCircleQuestion, Navigation } from 'lucide-react';
import { type CSSProperties, useRef } from 'react';

/** The three trust items at the bottom of the hero (Figma 712-26763), icons matched to the Figma glyphs. */
const VALUES: { key: 'hero_value_1' | 'hero_value_2' | 'hero_value_3'; icon: LucideIcon }[] = [
    { key: 'hero_value_1', icon: Building2 },
    { key: 'hero_value_2', icon: Navigation },
    { key: 'hero_value_3', icon: MessageCircleQuestion },
];

/**
 * Home hero (Figma 712-26754): fills the first screen (`min-h-svh`), the owner's clip running behind the sticky header
 * (pulled up by the header's height, `PublicLayout hero` + `SiteHeader overlay`), settling from a 1.05 zoom on load, 30 %
 * dark veil + bottom-up black gradient, and the three trust items with icons and hairline separators along the bottom
 * edge. The central block (eyebrow, h1 « L'agence de l'exceptionnel à Paris. », answer sentence, « Contacter un
 * conseiller ») was removed on 2026-09-25 (user decision): the page's h1 and answer-first paragraph are now the trust
 * intro right under the clip. The same day the Figma search bar (`HeroSearch`) took its place: at the top of the screen
 * on mobile, just above the trust row from `sm`.
 */
export default function Hero({ listings = null }: { listings?: number | null }) {
    const { t } = useTranslation();
    const row = useRef<HTMLUListElement>(null);
    // Mobile: the trust row is a snap carousel — opens on the middle item, a light swipe / wheel moves to the next item
    // and locks it centred, the mouse can drag it too (user decisions 2026-09-16).
    useDragScroll(row);

    return (
        <section
            aria-label={t('home.values_label')}
            className="relative -mt-16 flex min-h-svh flex-col justify-between overflow-hidden text-white sm:justify-end lg:-mt-19"
        >
            {/* The owner's clip as the background, rendered server-side with the photo as poster (user decision 2026-09-23: no photo-first fade) */}
            <HeroVideo />
            <div aria-hidden className="absolute inset-0 bg-black/30" />
            {/* Extra darkening behind the central block only (transparent at the edges), so the text stays legible on a bright sky */}
            <div aria-hidden className="absolute inset-0 bg-linear-to-b from-transparent via-black/45 to-transparent" />
            <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black via-black/0 via-30% to-transparent" />

            {/* Search bar (Figma 712-25068 / 712-25576, no logic yet — user decision 2026-09-25): at the top of the screen under the
                header on mobile, centred in the screen between the header and the trust row from `sm` (user decision 2026-09-25) */}
            <div
                style={rise(0).style}
                className={cn(
                    'relative mx-auto flex w-full max-w-7xl px-6 pt-28 sm:flex-1 sm:items-center sm:pt-16 sm:pb-6 lg:px-8',
                    rise(0).className,
                )}
            >
                <HeroSearch listings={listings} />
            </div>

            {/* Trust row (Figma 712-26763): one line with hairline separators at every width — on mobile it scrolls sideways
                (snap carousel centred on each item, draggable, hidden scrollbar) instead of stacking (user decisions 2026-09-16). */}
            <ul
                ref={row}
                role="list"
                aria-label={t('home.values_label')}
                style={rise(1).style}
                className={cn(
                    // Mobile: 40vw side padding lets the first / last item sit in the middle when snapped; snap is suspended while dragging.
                    'relative flex w-full cursor-grab snap-x snap-mandatory items-center gap-6 overflow-x-auto px-[40vw] pb-8 text-white/90 select-none [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none sm:cursor-auto sm:snap-none sm:justify-center sm:gap-8 sm:overflow-visible sm:px-6 sm:select-auto lg:gap-14 [&::-webkit-scrollbar]:hidden',
                    rise(1).className,
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
