import GradientHairline from '@/components/layout/gradient-hairline';
import PageEyebrow from '@/components/page/page-eyebrow';
import StatValue from '@/components/page/stat-value';
import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { useReveal } from '@/hooks/use-reveal';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Play } from 'lucide-react';
import { type CSSProperties, Fragment, type Ref, useRef, useState } from 'react';

export type BuyStat = { value: string; title: string; text: string };

export type ServiceHeroTexts = {
    eyebrow: string;
    headline: string;
    intro: string;
    cta: string;
    photo_alt: string;
    video_title: string;
    play_video: string;
    stats_label: string;
};

type ServiceHeroProps = {
    /** `id` of the h1 (`aria-labelledby` of the section). */
    id: string;
    /** Every wording, passed by the page's wrapper (`buy.*` / `sell.*`) so `SharedTranslations` shares only that page's section. */
    texts: ServiceHeroTexts;
    /** Target of the single full button. */
    href: string;
    /** Photo of the panel (`{w}` in `src` is replaced by each width of `widths`; `width` is the default `src` and the intrinsic size). */
    photo: { src: string; widths: number[]; width: number; height: number };
    /** Key figures (same real numbers as the About page). */
    stats: BuyStat[];
    /** YouTube id of the presentation video; null = photo only, no play button. */
    video: string | null;
    /** Observed by a page's mobile bar (Sell). */
    ref?: Ref<HTMLElement>;
};

/**
 * Service page hero (Figma 712-18453 desktop / 712-18766 mobile), shared by « Acheter » and « Vendre » (the Sell
 * page took exactly the Buy header on user decision 2026-09-22) through thin wrappers that pass their texts, photo,
 * target and figures. In the site's tone: on desktop the eyebrow + h1 on
 * the left and the answer-first intro + button on the right, bottom-aligned; on mobile everything centred and stacked.
 * Under it a wide photo panel (21/9 on desktop, 16/9 and edge to edge on mobile, square corners, entry zoom
 * `animate-hero-photo`) with, when a video is configured, a white play button in the middle (click-to-load YouTube
 * facade, same pattern as the blog). The key figures: on desktop in a dark glass card (`bg-black/40 backdrop-blur-md`)
 * over a short bottom veil, separated by white gradient hairlines; on mobile / tablet (and on desktop while the video
 * plays) under the panel in a 2×2 grid. They count up (`StatValue`) and rise in cascade when the panel enters the
 * viewport — UI review, user decision 2026-09-21.
 */
export default function ServiceHero({ id, texts, href, photo, stats, video, ref }: ServiceHeroProps) {
    const [playing, setPlaying] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const revealed = useReveal(panelRef, '-15%');

    const riseClass = revealed
        ? 'animate-hero-rise [animation-delay:var(--stagger)] motion-reduce:animate-none'
        : 'opacity-0 motion-reduce:opacity-100';
    const stacked = !(video && playing);

    // One figure: the value first for the eye and for assistive tech, counting up once revealed
    const figure = (stat: BuyStat, i: number, onPhoto: boolean) => (
        <li
            key={stat.title}
            style={{ '--stagger': `${i * 120}ms` } as CSSProperties}
            className={cn('flex min-w-0 flex-col gap-1', riseClass, onPhoto && 'flex-1')}
        >
            <p className={cn('font-heading text-xl font-medium tabular-nums', onPhoto && 'lg:text-2xl')}>
                <StatValue value={stat.value} run={revealed} />
            </p>
            <p className={cn('text-xs text-pretty', onPhoto ? 'text-white/80' : 'text-muted-foreground')}>{stat.title}</p>
        </li>
    );

    return (
        <section ref={ref} aria-labelledby={id} className="flex flex-col gap-10 lg:gap-14">
            {/* Header: eyebrow + h1 left, intro + button right on desktop, both on the same bottom line; centred stack on mobile */}
            <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:items-end lg:justify-between lg:gap-24 lg:text-left">
                <div className="flex flex-col gap-4">
                    <PageEyebrow>{texts.eyebrow}</PageEyebrow>
                    <h1 id={id} className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                        {texts.headline}
                    </h1>
                </div>
                <div className="flex max-w-md shrink-0 flex-col items-center gap-6 lg:max-w-sm lg:items-start">
                    {/* GEO: a self-contained sentence (brand + what + where) */}
                    <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{texts.intro}</p>
                    <Button asChild size="lg">
                        <Link href={href} prefetch>
                            {texts.cta}
                            <ArrowUpRight aria-hidden />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Photo panel: edge to edge on mobile, 21/9 on desktop; video facade when a video is configured */}
            <div ref={panelRef} className="flex flex-col gap-8">
                {video && playing ? (
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1`}
                        title={texts.video_title}
                        className="-mx-6 aspect-video w-[calc(100%+3rem)] lg:mx-0 lg:w-full"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div className="relative -mx-6 aspect-video overflow-hidden lg:mx-0 lg:aspect-[21/9]">
                        <SeoImage
                            src={photo.src.replace('{w}', String(photo.width))}
                            srcSet={photo.widths.map((w) => `${photo.src.replace('{w}', String(w))} ${w}w`).join(', ')}
                            sizes="(min-width: 80rem) 76rem, 100vw"
                            alt={texts.photo_alt}
                            width={photo.width}
                            height={photo.height}
                            priority
                            className="animate-hero-photo absolute inset-0 size-full object-cover motion-reduce:animate-none"
                        />
                        {/* Short bottom veil (30 %) so the glass card reads, the photo stays bright above */}
                        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[30%] bg-linear-to-t from-black/60 to-transparent" />
                        {video && (
                            <button
                                type="button"
                                onClick={() => setPlaying(true)}
                                aria-label={texts.play_video}
                                className="focus-ring bg-background text-foreground hover:bg-background-05 absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-300 motion-reduce:transition-none lg:size-20"
                            >
                                <Play aria-hidden className="ml-0.5 size-7 fill-current lg:size-9" />
                            </button>
                        )}
                        {/* Desktop: the figures in a dark glass card at the bottom of the photo (square corners, like the about hero) */}
                        <div className="absolute inset-x-10 bottom-10 hidden lg:block">
                            <ul
                                role="list"
                                aria-label={texts.stats_label}
                                className="flex items-center gap-10 bg-black/40 px-8 py-5 text-white backdrop-blur-md"
                            >
                                {stats.map((stat, i) => (
                                    <Fragment key={stat.title}>
                                        {i > 0 && (
                                            <li
                                                aria-hidden
                                                className="block h-10 w-px shrink-0 bg-linear-to-b from-transparent via-white/60 to-transparent"
                                            />
                                        )}
                                        {figure(stat, i, true)}
                                    </Fragment>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
                {/* Mobile / tablet (and desktop while the video plays): 2×2 grid under the panel, gradient hairlines between the rows */}
                <div className={cn('flex flex-col gap-6', stacked && 'lg:hidden')}>
                    {[stats.slice(0, 2), stats.slice(2)].map((row, r) => (
                        <Fragment key={r}>
                            {r > 0 && <GradientHairline />}
                            <ul role="list" aria-label={r === 0 ? texts.stats_label : undefined} className="grid grid-cols-2 gap-8">
                                {row.map((stat, i) => figure(stat, r * 2 + i, false))}
                            </ul>
                        </Fragment>
                    ))}
                </div>
            </div>
        </section>
    );
}
