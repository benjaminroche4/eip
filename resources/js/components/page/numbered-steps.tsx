import GradientHairline from '@/components/layout/gradient-hairline';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoImage from '@/components/seo/seo-image';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/** A titled step of the numbered list (`Strategy` DTO of `Domain/Content`: Buy strategies, Sell steps). */
export type Step = { title: string; text: string };

export type StepPhoto = {
    /** Photo path with a `{w}` placeholder for the width (`800` / `1600`). */
    src: string;
    /** Only the first photo carries the alt (the others are decorative, desktop-only cross-fades). */
    alt: string;
};

type NumberedStepsProps = {
    /** Id of the section's heading (`aria-labelledby`), unique per page. */
    id: string;
    /** Header: eyebrow, h2 (a question, GEO) and answer-first intro (a self-contained sentence, brand + what + where). */
    texts: { eyebrow: string; title: string; intro: string };
    /** The three steps (prop of the controller: `buy.strategies.items`, `sell.process.items`). */
    items: Step[];
    /** One photo per step, in order (`{w}` = width placeholder); only the first alt is read. */
    photos: StepPhoto[];
    /** One lucide icon per step, in order. */
    icons: LucideIcon[];
};

/**
 * Numbered steps with cross-fading photos — « Des stratégies conçues autour de vos objectifs » (Figma 712-18511 desktop /
 * 712-18821 mobile) built for the « Acheter » page and extracted on 2026-09-22 to serve the « Vendre » process (three
 * steps of the sale) as well; `BuyStrategies` wraps it with the Buy texts, photos and icons. Under the buy hero:
 * centred header (eyebrow, h2, answer-first intro), then on the left one photo per strategy (`strategies-{1,2,3}`,
 * placeholders for now): on desktop they cross-fade (700 ms) to follow the active strategy, under `lg` and under
 * `prefers-reduced-motion` only the first one shows; square on desktop, 16/9 on mobile, bare — the Figma's sentence
 * and check points over it were dropped (user decisions 2026-09-21)
 * and on the right the three strategies numbered like the About values (ui.sh variant « Numéros sable », user decision
 * 2026-09-21 — the Figma's flat sand cards would have doubled the advantages cards above): sand vertical thread with a
 * dot per strategy, big sand Montserrat number, title with a small lucide icon, one sentence, generously spaced. The
 * strategy under the middle line of the viewport (else the nearest to it, measured on every scroll frame — not an
 * IntersectionObserver band, which skipped a short step crossed between two callbacks, as on the About values) is the
 * active one: its number locks in (`animate-value-lock`) and the dot emits a ring (`animate-value-ring`), exactly like
 * the About values; nothing is active until the list has reached the middle of the viewport. Each row is also a button: a click (or Enter / Space) activates it, with
 * `aria-current` on the active one (user decision 2026-09-21). On mobile everything stacks, the photo first.
 */
export default function NumberedSteps({ id, texts: header, items, photos: pictures, icons }: NumberedStepsProps) {
    const listRef = useRef<HTMLOListElement>(null);
    const [active, setActive] = useState<number | null>(null);

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const rows = Array.from(list.querySelectorAll('li'));

        // Active step = the one under the middle line of the viewport, else the nearest one to it, computed from the
        // geometry on every scroll frame (one frame at a time). Same measure as the About values (bug 2026-09-21: an
        // IntersectionObserver on a thin middle band missed a short row crossed between two callbacks).
        let frame = 0;
        const follow = () => {
            frame = 0;
            const center = window.innerHeight / 2;
            const bounds = list.getBoundingClientRect();
            if (bounds.top > center || bounds.bottom < center) return; // the list has not reached the middle yet: nothing active
            let best = 0;
            let bestDistance = Infinity;
            rows.forEach((row, i) => {
                const rect = row.getBoundingClientRect();
                const distance = center < rect.top ? rect.top - center : center > rect.bottom ? center - rect.bottom : 0;
                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = i;
                }
            });
            setActive(best);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(follow);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        follow(); // the page may load already scrolled

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <section aria-labelledby={id} className="flex flex-col gap-10 lg:gap-14">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                <PageEyebrow>{header.eyebrow}</PageEyebrow>
                <h2 id={id} className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                    {header.title}
                </h2>
                {/* GEO: a self-contained sentence (brand + what + where) */}
                <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{header.intro}</p>
            </div>

            <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
                {/* Photos: one per strategy, cross-fading with the active one on desktop (the first stays alone under `lg`
                    and under `prefers-reduced-motion`); 16/9 on mobile, square on desktop, square corners, no frame, no text */}
                <div className="relative aspect-video overflow-hidden lg:aspect-square">
                    {items.map((item, i) => {
                        const shown = i === (active ?? 0);
                        const photo = pictures[i % pictures.length];
                        return (
                            <SeoImage
                                key={item.title}
                                src={photo.src.replace('{w}', '1600')}
                                srcSet={`${photo.src.replace('{w}', '800')} 800w, ${photo.src.replace('{w}', '1600')} 1600w`}
                                sizes="(min-width: 64rem) 50vw, 100vw"
                                alt={i === 0 ? photo.alt : ''}
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
                        const Icon = icons[i % icons.length];
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
