import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Pause, Play } from 'lucide-react';
import { Fragment, useState } from 'react';

const ITEMS = [1, 2, 3, 4, 5] as const;

/**
 * Commitments band (Figma 712-23866): a sand band (`bg-background-05`, the colour the manifesto band below starts with, so both read as one) with five uppercase Montserrat statements separated by sand dots,
 * scrolling endlessly from right to left (the track holds two identical halves of three lists each, every list the same width — trailing dot and right padding included — so the track sliding by -50 % lands exactly on the same pixels and a half always exceeds the viewport width). It pauses on hover
 * (user decision 2026-09-16), on focus within and on touch, and a Pause / Play button at the right of the band stops it for
 * good (WCAG 2.2.2: moving content that starts automatically and lasts more than five seconds needs a control). It stands
 * still under `prefers-reduced-motion` (the items then wrap on several lines).
 * The second copy is decorative and hidden from assistive tech.
 */
export default function ValuesMarquee() {
    const { t } = useTranslation();
    const [paused, setPaused] = useState(false);
    const [touched, setTouched] = useState(false);
    const list = (hidden: boolean) => (
        <ul
            role="list"
            aria-hidden={hidden || undefined}
            className="flex shrink-0 items-center gap-8 pr-8 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-3 motion-reduce:pr-0"
        >
            {ITEMS.map((n, i) => (
                <Fragment key={n}>
                    {i > 0 && <li aria-hidden className="bg-secondary-60 size-2.5 shrink-0 rounded-full" />}
                    <li className="font-heading text-muted-foreground/70 text-sm font-medium tracking-wider whitespace-nowrap uppercase">
                        {t(`about.marquee_${n}`)}
                    </li>
                </Fragment>
            ))}
            {/* Trailing dot in BOTH copies: each copy must be exactly the same width (items, dots, gaps, right padding) for the -50 % loop to be seamless */}
            <li aria-hidden className="bg-secondary-60 size-2.5 shrink-0 rounded-full motion-reduce:hidden" />
        </ul>
    );

    return (
        <div
            aria-label={t('about.marquee_label')}
            role="region"
            className="bg-background-05 group relative overflow-hidden py-8"
            // A touch pauses the track (no hover on touch screens); a tap on the button releases it
            onTouchStart={() => setTouched(true)}
            onTouchEnd={() => setTouched(false)}
            onTouchCancel={() => setTouched(false)}
        >
            {/* Track = two identical halves, each half = the list three times, so a half is always wider than the viewport
                (up to ~4K): sliding by -50 % never shows an empty tail before the loop restarts. */}
            <div
                className={cn(
                    'animate-marquee flex w-max group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none',
                    (paused || touched) && '[animation-play-state:paused]',
                )}
            >
                {list(false)}
                <span className="contents motion-reduce:hidden">
                    {list(true)}
                    {list(true)}
                    {list(true)}
                    {list(true)}
                    {list(true)}
                </span>
            </div>
            {/* Pause / Play (WCAG 2.2.2): at the right of the band, on a white square; hidden under `prefers-reduced-motion` (nothing moves) */}
            <Button
                type="button"
                variant="outline"
                size="icon"
                aria-pressed={paused}
                aria-label={paused ? t('about.marquee_play') : t('about.marquee_pause')}
                onClick={() => setPaused((p) => !p)}
                className="bg-card absolute top-1/2 right-6 -translate-y-1/2 motion-reduce:hidden lg:right-8"
            >
                {paused ? <Play aria-hidden className="ml-0.5 fill-current" /> : <Pause aria-hidden className="fill-current" />}
            </Button>
        </div>
    );
}
