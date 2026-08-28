import { useTranslation } from '@/hooks/use-translation';
import { Minus, Plus } from 'lucide-react';
import { type ComponentProps } from 'react';

type StepperInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
};

/** Number field with − / + pills (Figma 696-13177): the value stays a real, editable input (keyboard, screen readers). */
export default function StepperInput({ value, onChange, min = 0, max = 10, ...props }: StepperInputProps) {
    const { t } = useTranslation();
    const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
    const step = (delta: 1 | -1) => onChange(clamp(value + delta));

    return (
        <div className="border-input focus-within:border-ring focus-within:ring-ring/50 aria-invalid:border-destructive flex h-10 items-center gap-2 border p-1 focus-within:ring-[3px]">
            <button
                type="button"
                onClick={() => step(-1)}
                disabled={value <= min}
                aria-label={t('estimate.decrease')}
                className="focus-ring bg-grey-5 hover:bg-background-05 flex h-full w-14 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
            >
                <Minus aria-hidden className="size-4" />
            </button>
            <input
                {...props}
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(clamp(e.target.valueAsNumber))}
                className="min-w-0 flex-1 [appearance:textfield] bg-transparent text-center text-base font-medium tabular-nums outline-none md:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
                type="button"
                onClick={() => step(1)}
                disabled={value >= max}
                aria-label={t('estimate.increase')}
                className="focus-ring bg-grey-5 hover:bg-background-05 flex h-full w-14 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
            >
                <Plus aria-hidden className="size-4" />
            </button>
        </div>
    );
}
