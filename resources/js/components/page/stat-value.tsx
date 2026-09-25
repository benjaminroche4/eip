import { useEffect, useState } from 'react';

/** Counter: 1.4 s, expo-out — the same easing as the site's reveals. */
const COUNT_MS = 1400;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Counts up to the figure written in `value` (« 250 M€+ », « €250M+ », « 25+ »): the digits are parsed out, the prefix
 * and suffix stay as written, the grouping follows the source (space → French, otherwise English). The accessible text
 * is the final value from the start (`sr-only`); reduced motion (or no run) renders it directly. `from` starts the
 * count elsewhere than 0 — the arrondissement price rolls only over the difference with the previous one (2026-09-25).
 */
export default function StatValue({ value, run, from = 0 }: { value: string; run: boolean; from?: number }) {
    const match = /^([^\d]*)([\d\s.,]*\d)(.*)$/.exec(value);
    const [prefix, digits, suffix] = match ? [match[1], match[2], match[3]] : ['', '', value];
    const target = Number(digits.replace(/[\s.,]/g, ''));
    const locale = /\s/.test(digits) ? 'fr-FR' : 'en-GB';
    const [shown, setShown] = useState(from);
    const done = !match || !run || reducedMotion() ? target : shown;

    useEffect(() => {
        if (!match || !run || reducedMotion()) return;
        let frame = 0;
        const startAt = performance.now();
        setShown(from);
        const step = (now: number) => {
            const p = Math.min((now - startAt) / COUNT_MS, 1);
            setShown(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 4))));
            if (p < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, target, from]);

    if (!match) return <>{value}</>;
    return (
        <>
            <span className="sr-only">{value}</span>
            <span aria-hidden>
                {prefix}
                {done.toLocaleString(locale)}
                {suffix}
            </span>
        </>
    );
}
