import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';
import { useState, type ComponentProps, type KeyboardEvent } from 'react';

type StepperInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
};

// `aria-disabled` (not `disabled`) at the ends of the range: the button keeps the keyboard focus and just does nothing.
const buttonClass =
    'focus-ring bg-grey-5 hover:bg-background-05 flex h-full w-14 shrink-0 items-center justify-center rounded-none aria-disabled:pointer-events-none aria-disabled:opacity-40';

/**
 * Number field with − / + buttons (Figma 696-13177): the value stays a real, editable input (keyboard, screen readers).
 * On change the digit rolls like a slot reel (old one leaves, new one enters from the direction of travel);
 * the reel is a decorative overlay, hidden while the input itself has focus so typed text stays visible.
 * While the input has focus the typed text is a local draft (a cleared field stays empty instead of snapping to `min`):
 * the parent only hears finite numbers, and the draft is clamped and committed on blur or Enter.
 */
export default function StepperInput({ value, onChange, min = 0, max = 10, ...props }: StepperInputProps) {
    const { t } = useTranslation();
    const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
    const step = (delta: 1 | -1) => {
        const next = clamp(value + delta);
        if (next !== value) onChange(next);
    };

    // Draft of the typed text while the input has focus (null = not editing: the input mirrors `value`).
    const [draft, setDraft] = useState<string | null>(null);
    const commit = () => {
        if (draft !== null) onChange(clamp(Number(draft)));
        setDraft(null);
    };
    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        props.onKeyDown?.(e);
        if (e.key === 'Enter') {
            e.preventDefault(); // Enter commits the typed number, it does not submit the form
            commit();
        }
    };

    // Kept in state (not a ref + effect) so the reel survives unrelated re-renders of the form while it plays.
    const [reel, setReel] = useState<{ value: number; from: number | null }>({ value, from: null });
    if (reel.value !== value) setReel({ value, from: reel.value });
    const direction = reel.from === null ? null : value > reel.from ? 'up' : 'down';
    const leaving = direction ? reel.from : null;

    return (
        <div
            data-slot="stepper"
            className="border-input focus-within:border-ring focus-within:ring-ring/50 aria-invalid:border-destructive bg-card flex h-10 items-center gap-2 border p-1 focus-within:ring-[3px]"
        >
            <button type="button" onClick={() => step(-1)} aria-disabled={value <= min} aria-label={t('estimate.decrease')} className={buttonClass}>
                <Minus aria-hidden className="size-4" />
            </button>
            <div className="group relative min-w-0 flex-1 overflow-hidden">
                <input
                    {...props}
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
                    value={draft ?? value}
                    onChange={(e) => {
                        setDraft(e.target.value);
                        const typed = e.target.valueAsNumber;
                        if (Number.isFinite(typed)) onChange(clamp(typed));
                    }}
                    onFocus={(e) => {
                        props.onFocus?.(e);
                        setDraft(String(value));
                    }}
                    onBlur={(e) => {
                        props.onBlur?.(e);
                        commit();
                    }}
                    onKeyDown={onKeyDown}
                    className="focus:text-foreground w-full [appearance:textfield] bg-transparent text-center text-base font-medium text-transparent tabular-nums outline-none md:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 grid place-items-center text-base font-medium tabular-nums group-focus-within:hidden md:text-sm"
                >
                    {leaving !== null && (
                        <span
                            key={`out-${value}`}
                            className={cn(
                                'col-start-1 row-start-1 motion-reduce:hidden',
                                direction === 'up' ? 'animate-slot-out-up' : 'animate-slot-out-down',
                            )}
                        >
                            {leaving}
                        </span>
                    )}
                    <span
                        key={`in-${value}`}
                        className={cn(
                            'col-start-1 row-start-1 motion-reduce:animate-none',
                            direction === 'up' && 'animate-slot-in-up',
                            direction === 'down' && 'animate-slot-in-down',
                        )}
                    >
                        {value}
                    </span>
                </span>
            </div>
            <button type="button" onClick={() => step(1)} aria-disabled={value >= max} aria-label={t('estimate.increase')} className={buttonClass}>
                <Plus aria-hidden className="size-4" />
            </button>
        </div>
    );
}
