import GradientHairline from '@/components/layout/gradient-hairline';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoImage from '@/components/seo/seo-image';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Coins, type LucideIcon, ShieldCheck, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type BuyStrategy = { title: string; text: string };

type BuyStrategiesProps = {
    /** The three strategies (`buy.strategies.items`, prop of the controller). */
    items: BuyStrategy[];
};

/** One lucide icon per strategy, in order (the Figma's line-chart / coins / shield glyphs). */
const ICONS: LucideIcon[] = [TrendingUp, Coins, ShieldCheck];

/**
 * « Des stratégies conçues autour de vos objectifs » (Figma 712-18511 desktop / 712-18821 mobile), under the buy hero:
 * centred header (eyebrow, h2, answer-first intro), then on the left one photo per strategy (`strategies-{1,2,3}`,
 * placeholders for now): on desktop they cross-fade (700 ms) to follow the active strategy, under `lg` and under
 * `prefers-reduced-motion` only the first one shows; square on desktop, 16/9 on mobile, bare — the Figma's sentence
 * and check points over it were dropped (user decisions 2026-09-21)
 * and on the right the three strategies numbered like the About values (ui.sh variant « Numéros sable », user decision
 * 2026-09-21 — the Figma's flat sand cards would have doubled the advantages cards above): sand vertical thread with a
 * dot per strategy, big sand Montserrat number, title with a small lucide icon, one sentence, generously spaced. The
 * strategy crossing the middle of the viewport is the active one (IntersectionObserver): its number locks in
 * (`animate-value-lock`) and the dot emits a ring (`animate-value-ring`), exactly like the About values; nothing is
 * active before the first scroll. Each row is also a button: a click (or Enter / Space) activates it, with
 * `aria-current` on the active one (user decision 2026-09-21). On mobile everything stacks, the photo first.
 */
export default function BuyStrategies({ items }: BuyStrategiesProps) {
    const { t } = useTranslation();
    const listRef = useRef<HTMLOListElement>(null);
    const [active, setActive] = useState<number | null>(null);

    useEffect(() => {
        const list = listRef.current;
        if (!list || typeof IntersectionObserver === 'undefined') {
            setActive(0);
            return;
        }
        // The active strategy is the one crossing the middle band of the viewport.
        const rows = Array.from(list.querySelectorAll('li'));
        const follow = new IntersectionObserver(
            (entries) => {
                const hit = entries.find((e) => e.isIntersecting);
                if (hit) setActive(rows.indexOf(hit.target as HTMLLIElement));
            },
            { rootMargin: '-45% 0px -45% 0px' },
        );
        rows.forEach((row) => follow.observe(row));
        return () => follow.disconnect();
    }, []);

    return (
        <section aria-labelledby="buy-strategies-title" className="flex flex-col gap-10 lg:gap-14">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                <PageEyebrow>{t('buy.strategies.eyebrow')}</PageEyebrow>
                <h2 id="buy-strategies-title" className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                    {t('buy.strategies.title')}
                </h2>
                <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{t('buy.strategies.intro')}</p>
            </div>

            <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
                {/* Photos: one per strategy, cross-fading with the active one on desktop (the first stays alone under `lg`
                    and under `prefers-reduced-motion`); 16/9 on mobile, square on desktop, square corners, no frame, no text */}
                <div className="relative aspect-video overflow-hidden lg:aspect-square">
                    {items.map((item, i) => {
                        const shown = i === (active ?? 0);
                        return (
                            <SeoImage
                                key={item.title}
                                src={`/images/buy/strategies-${i + 1}-1600.jpg`}
                                srcSet={`/images/buy/strategies-${i + 1}-800.jpg 800w, /images/buy/strategies-${i + 1}-1600.jpg 1600w`}
                                sizes="(min-width: 64rem) 50vw, 100vw"
                                alt={i === 0 ? t('buy.strategies.photo_alt') : ''}
                                width={1600}
                                height={900}
                                className={cn(
                                    'absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none',
                                    i === 0
                                        ? cn('motion-reduce:opacity-100', !shown && 'lg:opacity-0')
                                        : cn('hidden motion-reduce:hidden lg:block', shown ? 'opacity-100' : 'opacity-0'),
                                )}
                            />
                        );
                    })}
                </div>

                {/* Strategies numbered like the About values: sand thread with a dot, big sand number, title + small icon, sentence */}
                <ol ref={listRef} className="relative flex flex-col gap-12 pl-6 lg:gap-14">
                    <GradientHairline vertical className="absolute top-2 bottom-2 left-0" />
                    {items.map((item, i) => {
                        const Icon = ICONS[i % ICONS.length];
                        const isActive = active === i;
                        return (
                            <li key={item.title} className="relative">
                                <span
                                    aria-hidden
                                    className={cn(
                                        'ring-background absolute top-4 -left-6 size-2 -translate-x-1/2 rounded-full ring-4 transition-colors duration-300',
                                        isActive ? 'bg-foreground' : 'bg-secondary-60',
                                    )}
                                />
                                {/* Lock-in ring: emitted once by the dot when this strategy becomes active (mounted only then, so it replays per lock) */}
                                {isActive && (
                                    <span
                                        aria-hidden
                                        data-testid="strategy-ring"
                                        className="border-foreground animate-value-ring absolute top-4 -left-6 size-2 rounded-full border motion-reduce:hidden"
                                    />
                                )}
                                {/* The whole row is a button: a click (or Enter / Space) activates the strategy, in addition to the scroll */}
                                <button
                                    type="button"
                                    onClick={() => setActive(i)}
                                    aria-current={isActive ? 'true' : undefined}
                                    className="group focus-ring hover:bg-background-05 -m-3 flex w-[calc(100%+1.5rem)] items-start gap-6 p-3 text-left transition-colors duration-300 motion-reduce:transition-none"
                                >
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'font-heading w-14 shrink-0 origin-left text-4xl font-semibold tabular-nums transition-colors duration-300 motion-reduce:transition-none',
                                            isActive
                                                ? 'text-foreground animate-value-lock motion-reduce:animate-none'
                                                : 'text-secondary-50 group-hover:text-secondary-60',
                                        )}
                                    >
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <span className="flex flex-1 flex-col gap-2 pt-2">
                                        <h3 className="flex items-center gap-3 text-lg font-medium">
                                            {item.title}
                                            <Icon aria-hidden className="text-muted-foreground size-4" strokeWidth={1.5} />
                                        </h3>
                                        <span className="text-muted-foreground block max-w-md text-base/7 text-pretty sm:text-sm/6">{item.text}</span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}
