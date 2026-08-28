import { cn } from '@/lib/utils';
import { type Country } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';

type CountryFlagProps = {
    country: Country;
    /** Accessible name; omit for a purely decorative flag (aria-hidden). */
    label?: string;
    className?: string;
};

/** National flag SVG shipped by react-phone-number-input (a flag is an asset, not an icon — lucide has none). 4:3, 18×12 by default. */
export default function CountryFlag({ country, label, className }: CountryFlagProps) {
    const Flag = flags[country];
    if (!Flag) return null;

    return (
        <span
            role={label ? 'img' : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            className={cn('inline-block h-3 w-4.5 shrink-0 overflow-hidden align-middle [&>svg]:size-full', className)}
        >
            <Flag title={label ?? ''} />
        </span>
    );
}
