import { useTranslation } from '@/hooks/use-translation';
import { METRO_LINES, RER_LINES } from '@/lib/paris-transit';
import { cn } from '@/lib/utils';

type TransitBadgeProps = {
    kind: 'metro' | 'rer';
    /** « 1 », « 3bis », « 14 » or « A »-« E ». */
    line: string;
};

/**
 * A metro or RER line badge as on the network maps: a full disc for the metro, a square for the RER (the site's
 * two shapes), Montserrat number on the line's official colour (`lib/paris-transit.ts`). Named for assistive tech
 * (« Ligne 4 », « RER B »); an unknown line falls back to the sand tile.
 */
export default function TransitBadge({ kind, line }: TransitBadgeProps) {
    const { t } = useTranslation();
    const colour = (kind === 'metro' ? METRO_LINES : RER_LINES)[line] ?? 'bg-background-08 text-foreground';
    const label = kind === 'metro' ? t('districts.line_label', { line }) : t('districts.rer_line_label', { line });

    return (
        <span
            role="img"
            aria-label={label}
            className={cn(
                'font-heading inline-flex h-7 min-w-7 shrink-0 items-center justify-center px-1.5 text-xs font-semibold tabular-nums',
                kind === 'metro' ? 'rounded-full' : 'rounded-none',
                colour,
            )}
        >
            {line}
        </span>
    );
}
