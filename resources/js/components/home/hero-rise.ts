import { type CSSProperties } from 'react';

/**
 * Cascade step for the home hero's reveal (`hero-rise`, 0.8 s expo-out): the tolerated dynamic CSS variable feeds
 * `animation-delay` — 300 ms for step 0, then +120 ms per step. Shared by the hero (trust row) and the search bar
 * (title, card, proof line) so the whole first screen rises in one sequence.
 */
export const rise = (step: number): { className: string; style: CSSProperties } => ({
    className: 'animate-hero-rise [animation-delay:var(--stagger)] motion-reduce:animate-none',
    style: { '--stagger': `${300 + step * 120}ms` } as CSSProperties,
});
