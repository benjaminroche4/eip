import GradientHairline from '@/components/layout/gradient-hairline';
import RingsBackdrop from '@/components/page/rings-backdrop';
import StatValue from '@/components/page/stat-value';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type CSSProperties, Fragment, useEffect, useRef, useState } from 'react';

export type AgencyStat = { value: string; title: string; text: string };

type AgencyManifestoProps = { stats: AgencyStat[] };

/**
 * « Plus qu'une agence immobilière » (Figma 712-23876 desktop / 712-24278 mobile), in the site's tone: the site's sand band
 * (`from-background-05 to-background from-40%`, breakout, exactly like the testimonials — the flat `bg-background-10` was
 * reviewed on user decision 2026-09-16), centred h2, two Montserrat statements (the brand name in semibold — the first one
 * is the GEO answer: brand + what + where), the brand key mark as a faint watermark (`brand/logo-mark.svg`, the very
 * glyph drawn in the Figma), then the key figures: four columns separated by the site's vertical gradient hairlines (same `via-border` as every other section) on desktop,
 * stacked with horizontal ones on mobile (the Figma's dotted rules become the site's gradient hairlines). The
 * figures live in `ui.about.stats` and must be real ones.
 * Reveal (user decision 2026-09-16): once the band enters the viewport, the text writes itself — every word of the
 * title then of the two statements settles from a slight 3D tilt while its blur clears, 40 ms after the previous one,
 * and the mark closes the sequence (`animate-manifesto-in` + `--stagger`, the tolerated dynamic style; `motion-reduce`
 * shows everything at once). Words stay plain text nodes separated by spaces, so assistive tech reads whole sentences.
 * Key figures (user decision 2026-09-16): when the grid enters the viewport each value counts up from 0 to its figure
 * (`StatValue`, `components/page/stat-value.tsx`, shared with the buy hero: prefix / digits / suffix parsed from the string, expo-out, the final value in `sr-only` throughout, the animated one `aria-hidden`), the
 * title and text rise in cascade under it (`animate-hero-rise`, 120 ms apart); `prefers-reduced-motion` shows the final
 * figures at once. Grid: stacked on mobile, 2×2 from `sm`, four columns from `lg`, gradient hairlines between.
 */
export default function AgencyManifesto({ stats }: AgencyManifestoProps) {
    const { t } = useTranslation();
    const sectionRef = useRef<HTMLElement>(null);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            setRevealed(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setRevealed(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '0px 0px -15% 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const gridRef = useRef<HTMLUListElement>(null);
    const [gridRevealed, setGridRevealed] = useState(false);
    useEffect(() => {
        const el = gridRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            setGridRevealed(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setGridRevealed(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '0px 0px -15% 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Word by word, as if written (user decision 2026-09-16): every word of the title then of the two statements
    // settles 40 ms after the previous one, the mark closes the sequence. `offset` chains the counters.
    const WORD_MS = 40;
    const animClass = revealed
        ? 'animate-manifesto-in [animation-delay:var(--stagger)] motion-reduce:animate-none'
        : 'opacity-0 motion-reduce:opacity-100';
    const words = (text: string, offset: number, className?: string) =>
        text.split(' ').map((word, i) => (
            <Fragment key={`${offset}-${i}`}>
                {i > 0 && ' '}
                <span style={{ '--stagger': `${(offset + i) * WORD_MS}ms` } as CSSProperties} className={cn('inline-block', animClass, className)}>
                    {word}
                </span>
            </Fragment>
        ));
    const title = t('about.manifesto_title');
    const brand = t('about.manifesto_brand');
    const first = t('about.manifesto_1');
    const second = t('about.manifesto_2');
    const count = (text: string) => text.split(' ').length;
    const brandAt = count(title);
    const firstAt = brandAt + count(brand);
    const secondAt = firstAt + count(first);
    const markAt = secondAt + count(second);

    return (
        <section
            ref={sectionRef}
            aria-labelledby="manifesto-title"
            className="from-background-05 to-background relative isolate bg-linear-to-b from-40%"
        >
            {/* Decorative SVG background (user decision 2026-09-16): the CTA card's concentric sand rings, larger, turning and breathing behind the band (a façade backdrop was tried first) */}
            <RingsBackdrop className="size-[64rem]" />
            <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-16 sm:py-20 lg:gap-16 lg:px-8">
                <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 text-center [perspective:800px]">
                    <h2 id="manifesto-title" className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                        {words(title, 0)}
                    </h2>
                    <div className="font-heading flex flex-col gap-5 text-xl/snug text-balance sm:text-2xl/snug lg:text-3xl/snug">
                        <p>
                            {words(brand, brandAt, 'font-semibold')}
                            {first.startsWith(',') ? '' : ' '}
                            {words(first, firstAt)}
                        </p>
                        <p>{words(second, secondAt)}</p>
                    </div>
                    <img
                        src="/brand/logo-mark.svg"
                        alt=""
                        width={59}
                        height={36}
                        loading="lazy"
                        style={{ '--stagger': `${markAt * WORD_MS}ms` } as CSSProperties}
                        className={cn('h-11 w-auto opacity-30', animClass)}
                    />
                </div>

                <ul ref={gridRef} role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-0 sm:gap-y-8 lg:grid-cols-4 lg:gap-y-0">
                    {stats.map((stat, i) => (
                        <Fragment key={stat.title}>
                            {/* Separators: horizontal hairline between every figure on mobile, between the two rows from sm */}
                            {i > 0 && <GradientHairline className={cn('via-border', i === 2 ? 'sm:col-span-2 lg:hidden' : 'sm:hidden')} />}
                            <li
                                style={{ '--stagger': `${i * 120}ms` } as CSSProperties}
                                className={cn(
                                    'relative flex flex-col gap-8 lg:gap-16',
                                    // Vertical hairline on the left of the 2nd column (sm) / of every column but the first (lg)
                                    'before:via-border before:absolute before:inset-y-0 before:left-0 before:hidden before:w-px before:bg-linear-to-b before:from-transparent before:to-transparent',
                                    i % 2 === 1 ? 'sm:pl-8 sm:before:block' : 'sm:pr-8',
                                    i === 0 && 'lg:pr-8 lg:pl-0',
                                    i === 1 && 'lg:px-8',
                                    i === 2 && 'lg:px-8 lg:before:block',
                                    i === 3 && 'lg:pr-0 lg:pl-8',
                                )}
                            >
                                <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                                    <StatValue value={stat.value} run={gridRevealed} />
                                </p>
                                <div
                                    className={cn(
                                        'flex flex-col gap-2',
                                        gridRevealed
                                            ? 'animate-hero-rise [animation-delay:var(--stagger)] motion-reduce:animate-none'
                                            : 'opacity-0 motion-reduce:opacity-100',
                                    )}
                                >
                                    <h3 className="text-lg font-medium text-balance">{stat.title}</h3>
                                    <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{stat.text}</p>
                                </div>
                            </li>
                        </Fragment>
                    ))}
                </ul>
            </div>
        </section>
    );
}
