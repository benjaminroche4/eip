import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';

export type SelectionOption = { value: string; label: string; icon: LucideIcon };

type SelectionCardsProps = {
    id?: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectionOption[];
    'aria-labelledby': string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
    /** Column count on desktop (mobile is always one column). */
    columns?: 2 | 3;
};

/**
 * Radio group rendered as selection cards (Figma 696-13136): icon, label, radio dot on the right. The checked card sits
 * on the light-sand surface with a sand border. Radix handles the roving focus and the arrow keys.
 */
export default function SelectionCards({ id, name, value, onChange, options, columns = 3, ...aria }: SelectionCardsProps) {
    return (
        <RadioGroupPrimitive.Root
            id={id}
            name={name}
            value={value}
            onValueChange={onChange}
            {...aria}
            className={cn('grid gap-3', columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}
        >
            {options.map(({ value: optionValue, label, icon: Icon }) => (
                <RadioGroupPrimitive.Item
                    key={optionValue}
                    value={optionValue}
                    className={cn(
                        'group focus-ring border-border bg-card flex items-center gap-2 rounded-none border px-4 py-3 text-left text-base transition-transform duration-150 active:scale-98 motion-reduce:transition-none motion-reduce:active:scale-100 sm:text-sm',
                        'hover:bg-background-05 data-[state=checked]:bg-background-05 data-[state=checked]:border-secondary-50',
                        'aria-invalid:border-destructive',
                    )}
                >
                    <Icon aria-hidden className="text-muted-foreground size-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {/* Radio dot: hollow, filled with a white centre once checked */}
                    <span
                        aria-hidden
                        className="border-grey-40 group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary flex size-4 shrink-0 items-center justify-center rounded-full border"
                    >
                        <RadioGroupPrimitive.Indicator className="bg-card animate-pop size-1.5 rounded-full motion-reduce:animate-none" />
                    </span>
                </RadioGroupPrimitive.Item>
            ))}
        </RadioGroupPrimitive.Root>
    );
}
