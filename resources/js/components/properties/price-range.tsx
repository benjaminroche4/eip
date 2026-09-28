import { BUDGETS, RENTS, type Transaction } from '@/components/search/search-bar';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from '@/hooks/use-translation';
import { groupThousands } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { Wallet } from 'lucide-react';
import { useId, useRef } from 'react';

/** Lowest / highest price of the listings per transaction, from the server. */
export type PriceBounds = Record<Transaction, { min: number; max: number }>;

/**
 * The range runs from the cheapest to the dearest listing of the project (user decision 2026-09-28), rounded outward
 * to a step of about 1 % of the span (a round figure: 10 000 € for sales, 50 € for rents); a thumb at a bound = no
 * limit on that side.
 */
export function rangeOf(bounds: { min: number; max: number }): { min: number; max: number; step: number } {
    const span = Math.max(bounds.max - bounds.min, 1);
    const step = Math.max(Math.pow(10, Math.floor(Math.log10(span / 100))), 1);
    const stepped = span / step > 250 ? step * 5 : span / step > 100 ? step * 2 : step;
    const min = Math.floor(bounds.min / stepped) * stepped;
    const max = Math.max(Math.ceil(bounds.max / stepped) * stepped, min + stepped);
    return { min, max, step: stepped };
}

type PriceRangeProps = {
    transaction: Transaction;
    bounds: PriceBounds;
    /** Grouped digits as the bar holds them ('' = none). */
    min: string;
    max: string;
    onChange: (min: string, max: string) => void;
};

/**
 * One digit column of the rolling amount: when it changes, the old digit slides out and the new one slides in
 * (the estimate stepper's slot roll, `slot-in/out-up/down`), upward when the amount grows.
 */
function RollingChar({ char, direction }: { char: string; direction: 'up' | 'down' | null }) {
    const previous = useRef(char);
    const leaving = previous.current !== char ? previous.current : null;
    previous.current = char;
    return (
        <span className="relative inline-grid overflow-hidden align-baseline">
            {leaving !== null && direction && (
                <span
                    key={`out-${char}`}
                    aria-hidden
                    className={cn(
                        'col-start-1 row-start-1 motion-reduce:hidden',
                        direction === 'up' ? 'animate-slot-out-up' : 'animate-slot-out-down',
                    )}
                >
                    {leaving}
                </span>
            )}
            <span
                key={`in-${char}`}
                className={cn(
                    'col-start-1 row-start-1 motion-reduce:animate-none',
                    direction === 'up' && 'animate-slot-in-up',
                    direction === 'down' && 'animate-slot-in-down',
                )}
            >
                {char}
            </span>
        </span>
    );
}

/** A large amount whose digits roll like a slot machine on each change (user decision 2026-09-28, « effet casino »). */
export function RollingAmount({ value, direction, className }: { value: string; direction: 'up' | 'down' | null; className?: string }) {
    return (
        <span className={cn('font-heading text-xl font-semibold tabular-nums sm:text-2xl', className)} aria-hidden>
            {Array.from(value).map((char, i) => (
                <RollingChar key={i} char={char} direction={direction} />
            ))}
        </span>
    );
}

/**
 * Head of the filters modal (user decision 2026-09-28): the budget in large, rolling digits, driven by a two-thumb
 * slider — min on the left, max on the right, the cheapest / dearest listing's price at the bounds (user decision
 * 2026-09-28: the real prices, not « Sans minimum »; a thumb at a bound still means no limit). It writes the same
 * criteria as the bar's budget cell and the modal's minimum, which it replaces there.
 */
export default function PriceRange({ transaction, bounds, min, max, onChange }: PriceRangeProps) {
    const { t, locale } = useTranslation();
    const id = useId();
    const range = rangeOf(bounds[transaction]);
    const parse = (v: string, fallback: number) => Number(v.replace(/\D/g, '')) || fallback;
    const lo = Math.min(Math.max(parse(min, range.min), range.min), range.max);
    const hi = Math.min(Math.max(parse(max, range.max), range.min), range.max);
    const last = useRef<[number, number]>([lo, hi]);
    const direction: 'up' | 'down' | null =
        lo + hi > last.current[0] + last.current[1] ? 'up' : lo + hi < last.current[0] + last.current[1] ? 'down' : null;
    last.current = [lo, hi];
    const noMin = lo <= range.min;
    const noMax = hi >= range.max;
    const label = (n: number) => `${groupThousands(String(n), locale)} €`;
    // At a bound the amount shown is the cheapest / dearest listing itself, not « Sans minimum » (user decision 2026-09-28)
    const shownMin = noMin ? label(bounds[transaction].min) : label(lo);
    const shownMax = noMax ? label(bounds[transaction].max) : label(hi);
    const presets = (transaction === 'rent' ? RENTS : BUDGETS).filter((n) => n > range.min && n < range.max);

    return (
        <div className="bg-background-05 flex flex-col gap-4 px-5 py-5">
            <p id={`${id}-label`} className="text-muted-foreground flex items-center gap-1.5 text-[0.6875rem] font-medium tracking-wider uppercase">
                <Wallet aria-hidden className="size-3.5" strokeWidth={1.5} />
                {t('properties.range_label')}
            </p>
            <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="flex flex-col">
                    <span className="text-muted-foreground text-xs">{t('properties.range_from')}</span>
                    <RollingAmount value={shownMin} direction={direction} />
                    <span className="sr-only">{shownMin}</span>
                </span>
                <span className="flex flex-col text-right">
                    <span className="text-muted-foreground text-xs">{t('properties.range_to')}</span>
                    <RollingAmount value={shownMax} direction={direction} />
                    <span className="sr-only">{shownMax}</span>
                </span>
            </p>
            <Slider
                aria-labelledby={`${id}-label`}
                thumbLabels={[t('properties.range_min_thumb'), t('properties.range_max_thumb')]}
                min={range.min}
                max={range.max}
                step={range.step}
                minStepsBetweenThumbs={1}
                value={[lo, hi]}
                onValueChange={([a, b]) =>
                    onChange(a <= range.min ? '' : groupThousands(String(a), locale), b >= range.max ? '' : groupThousands(String(b), locale))
                }
                className="py-2"
            />
            <p role="status" className="sr-only">
                {t('properties.range_status', { min: shownMin, max: shownMax })}
            </p>
            <div role="group" aria-label={t('search_bar.budget_shortcuts')} className="flex flex-wrap gap-2">
                {presets.map((n) => (
                    <button
                        key={n}
                        type="button"
                        aria-pressed={hi === n}
                        onClick={() => onChange(min, hi === n ? '' : groupThousands(String(n), locale))}
                        className={cn(
                            'focus-ring border px-2 py-0.5 text-xs font-medium tabular-nums transition-colors duration-300 motion-reduce:transition-none',
                            hi === n ? 'border-primary bg-primary text-primary-foreground' : 'border-secondary-30 bg-card hover:bg-background-08',
                        )}
                    >
                        {`< ${groupThousands(String(n), locale)}`}
                    </button>
                ))}
            </div>
        </div>
    );
}
