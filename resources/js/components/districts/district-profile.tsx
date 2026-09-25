import { type District } from '@/components/districts/paris-map';
import TransitBadge from '@/components/districts/transit-badge';
import GradientHairline from '@/components/layout/gradient-hairline';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { GraduationCap, Info, Landmark, Lightbulb, type LucideIcon, TrainFront, TreeDeciduous, UtensilsCrossed } from 'lucide-react';
import { type ReactNode } from 'react';

type DistrictProfileProps = {
    d: District;
    /** Picker round: only the selected arrondissement carries the 20 options (the 19 hidden ones would all share the same label). */ picker?: boolean;
};

type Rubric = { key: string; icon: LucideIcon; label: string; items: string[] };

/* ————— Pieces of the column ————— */

function useRubrics(d: District): Rubric[] {
    const { t } = useTranslation();
    return [
        { key: 'attractions', icon: Landmark, label: t('districts.attractions_label'), items: d.attractions },
        { key: 'dining', icon: UtensilsCrossed, label: t('districts.dining_label'), items: d.dining },
        { key: 'parks', icon: TreeDeciduous, label: t('districts.parks_label'), items: d.parks },
        { key: 'education', icon: GraduationCap, label: t('districts.education_label'), items: d.education },
    ];
}

function Header({ d, className }: { d: District; className?: string }) {
    const { t } = useTranslation();
    return (
        <div className={cn('flex flex-col', className)}>
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{t('districts.detail_title')}</p>
            <h3 id={`arrondissement-${d.n}-title`} className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">
                {d.name}
            </h3>
            <p className="text-muted-foreground mt-2 text-base/7 sm:text-sm/6">{d.areas}</p>
        </div>
    );
}

function Dots({ items, className }: { items: string[]; className?: string }) {
    return (
        <ul role="list" className={cn('flex flex-col gap-2.5 text-base/7', className)}>
            {items.map((item) => (
                <li
                    key={item}
                    className="before:bg-primary relative pl-6 before:absolute before:top-3 before:left-0 before:size-1.5 before:rounded-full"
                >
                    {item}
                </li>
            ))}
        </ul>
    );
}

function Chips({ items }: { items: string[] }) {
    return (
        <ul role="list" className="flex flex-wrap gap-2">
            {items.map((item) => (
                <li key={item} className="border-border border px-2.5 py-1 text-sm">
                    {item}
                </li>
            ))}
        </ul>
    );
}

function Transport({ d, className }: { d: District; className?: string }) {
    const { t } = useTranslation();
    return (
        <dl className={cn('flex flex-col gap-3', className)}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <dt className="text-muted-foreground w-16 text-sm">{t('districts.metro_label')}</dt>
                <dd className="flex flex-wrap gap-1.5">
                    {d.metro.map((line) => (
                        <TransitBadge key={line} kind="metro" line={line} />
                    ))}
                </dd>
            </div>
            {d.rer.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <dt className="text-muted-foreground w-16 text-sm">{t('districts.rer_label')}</dt>
                    <dd className="flex flex-wrap gap-1.5">
                        {d.rer.map((line) => (
                            <TransitBadge key={line} kind="rer" line={line} />
                        ))}
                    </dd>
                </div>
            )}
            {d.stations.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <dt className="text-muted-foreground w-16 text-sm">{t('districts.stations_label')}</dt>
                    <dd className="flex flex-wrap gap-2">
                        {d.stations.map((station) => (
                            <span key={station} className="border-border inline-flex items-center border px-2.5 py-1 text-sm">
                                {station}
                            </span>
                        ))}
                    </dd>
                </div>
            )}
        </dl>
    );
}

function Extra({ d, className }: { d: District; className?: string }) {
    const { t } = useTranslation();
    return (
        <aside className={cn('bg-background-08 p-2', className)} aria-labelledby={`arrondissement-${d.n}-extra`}>
            <h4 id={`arrondissement-${d.n}-extra`} className="flex items-center gap-3 px-2 py-3 text-lg font-medium tracking-tight">
                <span aria-hidden className="border-secondary-30 bg-card flex size-9 shrink-0 items-center justify-center border">
                    <Lightbulb className="size-4" strokeWidth={1.5} />
                </span>
                {t('districts.extra_label')}
            </h4>
            <p className="bg-card p-4 text-base/7 text-pretty sm:p-6">{d.extra}</p>
        </aside>
    );
}

function Source({ className }: { className?: string }) {
    const { t } = useTranslation();
    return (
        // Lighter grey than the body's muted text (user decision 2026-09-25) — grey-60 keeps ≥ 4.5:1 on white, grey-50 would not
        <p className={cn('text-grey-60 flex gap-2 text-xs text-pretty', className)}>
            <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            {t('districts.source')}
        </p>
    );
}

/**
 * Left column of the arrondissement profile: header, detailed summary as the lead, then every rubric (strengths,
 * audience, housing, transport with the metro / RER badges, sights, food, green spaces, schools) hung on a vertical
 * sand thread, « À retenir » double card and the prices' source.
 */
export default function DistrictProfile({ d }: DistrictProfileProps) {
    const { t } = useTranslation();
    const rubrics = useRubrics(d);
    const textRubrics: { key: string; label: string; body: ReactNode }[] = [
        { key: 'positives', label: t('districts.positives_label'), body: <Dots items={d.positives} /> },
        { key: 'audience', label: t('districts.audience_label'), body: <p className="text-base/7 text-pretty">{d.audience}</p> },
        { key: 'housing', label: t('districts.housing_label'), body: <p className="text-base/7 text-pretty">{d.housing}</p> },
    ];
    const allRubrics: { key: string; icon?: LucideIcon; label: string; body: ReactNode }[] = [
        ...textRubrics,
        { key: 'transport', icon: TrainFront, label: t('districts.transport_label'), body: <Transport d={d} /> },
        ...rubrics.map((r) => ({ key: r.key, icon: r.icon, label: r.label, body: <Chips items={r.items} /> })),
    ];

    return (
        // White surface on the section's sand band, no border (user decisions 2026-09-25)
        <div className="bg-card flex min-w-0 flex-col p-5 sm:p-8">
            <div className="flex max-w-prose min-w-0 flex-col">
                <Header d={d} />
                <p className="mt-8 text-base/7 text-pretty">{d.summary}</p>
                {/* Rubrics on a vertical sand thread with a dot per rubric, as the values of the About page — ui.sh variant
                « Fil vertical sable » chosen among 20 (user decision 2026-09-25) */}
                <ol className="relative mt-10 flex flex-col gap-10 pl-8">
                    <span aria-hidden className="absolute top-2 bottom-2 left-1.5 flex">
                        <GradientHairline vertical />
                    </span>
                    {allRubrics.map((r) => (
                        <li key={r.key} className="relative flex flex-col gap-3">
                            <span aria-hidden className="bg-secondary-60 absolute top-2.5 -left-8 size-3 rounded-full" />
                            {/* Place rubrics carry their icon, the three text rubrics do not: two families at a glance (2026-09-25) */}
                            <h4 className="flex items-center gap-2 text-xl font-medium">
                                {r.icon && <r.icon aria-hidden className="text-secondary-80 size-5" strokeWidth={1.5} />}
                                {r.label}
                            </h4>
                            {r.body}
                        </li>
                    ))}
                </ol>
                <Extra d={d} className="mt-10" />
                <Source className="mt-8" />
            </div>
        </div>
    );
}
