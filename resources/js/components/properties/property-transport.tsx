import TransitBadge from '@/components/districts/transit-badge';
import { type Property } from '@/components/properties/property-card';
import { useTranslation } from '@/hooks/use-translation';
import { Footprints } from 'lucide-react';

/**
 * Stations near the building (2026-09-28): the line badges of the arrondissement pages and the walking time,
 * without giving the exact address away.
 */
export default function PropertyTransport({ property }: { property: Property }) {
    const { t } = useTranslation();
    const stops = property.transport ?? [];
    if (stops.length === 0) return null;

    return (
        // One station per row on three aligned columns: the line badges, the station, the walking time (legibility, 2026-09-29)
        <ul role="list" className="divide-border/60 flex flex-col divide-y">
            {stops.map((stop) => (
                <li key={stop.name} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2 text-sm first:pt-0 last:pb-0">
                    <span className="flex items-center gap-1">
                        {stop.lines.map((line) => (
                            <TransitBadge key={line} kind={stop.kind} line={line} />
                        ))}
                    </span>
                    <span className="truncate font-medium">{stop.name}</span>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs whitespace-nowrap tabular-nums">
                        <Footprints aria-hidden className="size-3.5" strokeWidth={1.5} />
                        {t('property.walk_minutes', { minutes: stop.minutes })}
                    </span>
                </li>
            ))}
        </ul>
    );
}
