import { useTranslation } from '@/hooks/use-translation';
import { Fragment } from 'react';

const ITEMS = [1, 2, 3, 4, 5] as const;

/**
 * Commitments band (Figma 712-23866): a sand band (`bg-background-05`, the colour the manifesto band below starts with, so both read as one) with five uppercase Montserrat statements separated by sand dots,
 * scrolling endlessly from right to left (the track holds two identical halves of three lists each, every list the same width — trailing dot and right padding included — so the track sliding by -50 % lands exactly on the same pixels and a half always exceeds the viewport width). It pauses on hover
 * (user decision 2026-09-16) and stands still under `prefers-reduced-motion` (the items then wrap on several lines).
 * The second copy is decorative and hidden from assistive tech.
 */
export default function ValuesMarquee() {
    const { t } = useTranslation();
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
        <div aria-label={t('about.marquee_label')} role="region" className="bg-background-05 group overflow-hidden py-8">
            {/* Track = two identical halves, each half = the list three times, so a half is always wider than the viewport
                (up to ~4K): sliding by -50 % never shows an empty tail before the loop restarts. */}
            <div className="animate-marquee flex w-max group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none">
                {list(false)}
                <span className="contents motion-reduce:hidden">
                    {list(true)}
                    {list(true)}
                    {list(true)}
                    {list(true)}
                    {list(true)}
                </span>
            </div>
        </div>
    );
}
