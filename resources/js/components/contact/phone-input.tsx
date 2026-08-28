import CountryFlag from '@/components/i18n/country-flag';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Check, ChevronDown } from 'lucide-react';
import { type ComponentProps, forwardRef, useState } from 'react';
import ReactPhoneInput, { type Country, getCountryCallingCode } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en.json';
import fr from 'react-phone-number-input/locale/fr.json';

const LABELS: Record<string, typeof fr> = { fr, en };
const DEFAULT_COUNTRY: Record<string, Country> = { fr: 'FR', en: 'GB' };

type CountryOption = { value?: Country; label: string; divider?: boolean };

type CountrySelectProps = {
    value?: Country;
    onChange: (country?: Country) => void;
    options: CountryOption[];
    disabled?: boolean;
    readOnly?: boolean;
    'aria-label'?: string;
    searchPlaceholder: string;
    emptyLabel: string;
};

/**
 * Country picker rendered by react-phone-number-input as a searchable combobox (shadcn Popover + Command):
 * compact trigger "flag ISO ⌄", list of "flag name +code" filtered by name or calling code.
 */
function CountrySelect({ value, onChange, options, disabled, readOnly, searchPlaceholder, emptyLabel, ...props }: CountrySelectProps) {
    const [open, setOpen] = useState(false);
    const countries = options.filter((o): o is CountryOption & { value: Country } => Boolean(o.value) && !o.divider);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    aria-label={props['aria-label']}
                    disabled={disabled || readOnly}
                    className="h-full shrink-0 gap-1.5 px-3 font-normal hover:bg-transparent"
                >
                    {value && <FlagLabel country={value} label={value} />}
                    <ChevronDown aria-hidden className="text-muted-foreground size-3.5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-0">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyLabel}</CommandEmpty>
                        <CommandGroup>
                            {countries.map((c) => {
                                const code = `+${getCountryCallingCode(c.value)}`;
                                return (
                                    <CommandItem
                                        key={c.value}
                                        value={`${c.label} ${code}`}
                                        onSelect={() => {
                                            onChange(c.value);
                                            setOpen(false);
                                        }}
                                    >
                                        <FlagLabel country={c.value} label={c.label} className="min-w-0 flex-1 [&>span:last-child]:truncate" />
                                        <span className="text-muted-foreground tabular-nums">{code}</span>
                                        <Check aria-hidden className={cn('size-4', value === c.value ? 'opacity-100' : 'opacity-0')} />
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

/** Flag + text label, as shown in the trigger and in the list. */
function FlagLabel({ country, label, className }: { country: Country; label: string; className?: string }) {
    return (
        <span className={cn('flex items-center gap-2', className)}>
            <CountryFlag country={country} />
            <span>{label}</span>
        </span>
    );
}

/** Number field inside the wrapper: the wrapper carries the border and focus ring. */
const NumberInput = forwardRef<HTMLInputElement, ComponentProps<'input'>>(function NumberInput(props, ref) {
    return <Input ref={ref} {...props} className="h-full min-w-0 flex-1 border-0 bg-transparent focus-visible:border-0 focus-visible:ring-0" />;
});

type PhoneInputProps = {
    id: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
    'aria-required'?: boolean;
};

/**
 * International phone field (Figma 261-7439): searchable country picker with flag | hairline | number,
 * in one bordered box styled like the other inputs. Emits an E.164 value ("+41782157284"), capped at the country's max length.
 */
export default function PhoneInput({ id, name, value, onChange, ...aria }: PhoneInputProps) {
    const { t } = useTranslation();
    const { locale } = usePage<SharedData>().props;

    return (
        <ReactPhoneInput
            international
            countryCallingCodeEditable={false}
            defaultCountry={DEFAULT_COUNTRY[locale] ?? 'FR'}
            labels={LABELS[locale] ?? fr}
            value={value}
            onChange={(v) => onChange(v ?? '')}
            limitMaxLength // no more digits than the selected country allows (E.164)
            id={id}
            name={name}
            autoComplete="tel"
            inputComponent={NumberInput}
            countrySelectComponent={CountrySelect}
            countrySelectProps={{
                'aria-label': t('contact.country'),
                searchPlaceholder: t('contact.country_search'),
                emptyLabel: t('contact.country_empty'),
            }}
            className={cn(
                'border-input divide-input flex h-10 w-full divide-x border transition-[color,box-shadow]',
                'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
                aria['aria-invalid'] && 'border-destructive ring-destructive/20 focus-within:border-destructive',
            )}
            numberInputProps={aria}
        />
    );
}
