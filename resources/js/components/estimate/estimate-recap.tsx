import GradientHairline from '@/components/layout/gradient-hairline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/hooks/use-translation';
import { focusField } from '@/lib/focus-field';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { type CSSProperties } from 'react';

const ADVISORS = [
    { id: 1, initials: 'AB' },
    { id: 2, initials: 'CD' },
    { id: 3, initials: 'EF' },
] as const;

export type EstimateRecapValues = {
    property_type: string;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    surface: string;
    floor: string;
    elevator: boolean;
    rooms: number;
    bedrooms: number;
    features: string[];
    condition: string;
    estimated_value: string;
    contact_method: string;
    message: string;
};

type EstimateRecapProps = {
    values: EstimateRecapValues;
    /** No card frame (border, shadow) — the tinted top and padding stay: the container already is a surface (mobile sheet). */
    frameless?: boolean;
};

type Row = {
    field: string;
    label: string;
    value: string;
    /** counts towards the progress line and the group's completion */
    required?: boolean;
    /** short answer: half a line, paired with its neighbour */
    short?: boolean;
    /** shown as a count instead of the text (features) */
    count?: number;
};

/**
 * Live summary of the valuation request (sticky card beside the form), five numbered groups (the step questions) of
 * short-labelled lines (user decision), filled in as the owner types (no transition on the value itself — user decision); empty ones stay dimmed with a dash (validation errors stay in the form, not here). Each line is a button that focuses its field. Announced politely to screen readers.
 */
export default function EstimateRecap({ values, frameless = false }: EstimateRecapProps) {
    const { t } = useTranslation();
    const number = (n: string) => (n ? Number(n).toLocaleString('fr-FR') : '');
    const features = values.features.map((f) => t(`estimate.features_list.${f}`));

    // Short labels (ui.estimate.recap_labels.*) under the five numbered step questions — the form carries the full labels
    const label = (key: string) => t(`estimate.recap_labels.${key}`);
    const groups: { title: string; rows: Row[] }[] = [
        {
            title: t('estimate.step_type'),
            rows: [
                {
                    field: 'property_type',
                    required: true,
                    label: label('property_type'),
                    value: values.property_type ? t(`estimate.property_types.${values.property_type}`) : '',
                },
            ],
        },
        {
            title: t('estimate.step_contact'),
            rows: [
                { field: 'full_name', required: true, label: label('full_name'), value: values.full_name.trim() },
                { field: 'email', required: true, label: label('email'), value: values.email.trim() },
                { field: 'phone', required: true, label: label('phone'), value: values.phone },
            ],
        },
        {
            title: t('estimate.step_details'),
            rows: [
                { field: 'address', required: true, label: label('address'), value: values.address.trim() },
                {
                    field: 'surface',
                    required: true,
                    short: true,
                    label: label('surface'),
                    value: values.surface ? `${number(values.surface)} ${t('estimate.surface_unit')}` : '',
                },
                {
                    field: 'floor',
                    short: true,
                    label: label('floor'),
                    value: [values.floor && t(`estimate.floors.${values.floor}`), values.elevator && t('estimate.elevator')]
                        .filter(Boolean)
                        .join(' · '),
                },
                { field: 'rooms', short: true, label: label('rooms'), value: `${values.rooms} · ${values.bedrooms} ${label('bedrooms_short')}` },
                { field: 'features', short: true, label: label('features'), value: features.join(', '), count: features.length },
                {
                    field: 'condition',
                    short: true,
                    label: label('condition'),
                    value: values.condition ? t(`estimate.conditions.${values.condition}`) : '',
                },
                {
                    field: 'estimated_value',
                    short: true,
                    label: label('estimated_value'),
                    value: values.estimated_value ? `${number(values.estimated_value)} ${t('estimate.estimated_value_unit')}` : '',
                },
            ],
        },
        {
            title: t('estimate.step_method'),
            rows: [
                {
                    field: 'contact_method',
                    required: true,
                    label: label('contact_method'),
                    value: values.contact_method ? t(`estimate.contact_methods.${values.contact_method}`) : '',
                },
            ],
        },
        {
            title: t('estimate.step_more'),
            // Free text never lands in the card (it can be 2,000 characters long): only the fact that a note exists
            rows: [{ field: 'message', label: label('message'), value: values.message.trim() ? t('estimate.recap_note_added') : '' }],
        },
    ];

    const rows = groups.flatMap((g) => g.rows);
    const required = rows.filter((r) => r.required);
    const progress = Math.round((required.filter((r) => r.value !== '').length / required.length) * 100);
    const isComplete = (group: { rows: Row[] }) =>
        group.rows.some((r) => r.required) && group.rows.filter((r) => r.required).every((r) => r.value !== '');

    return (
        <aside aria-labelledby="estimate-recap-title" className={cn(!frameless && 'border-secondary-30 bg-card border p-2 shadow-lg shadow-black/5')}>
            <div className="from-background-05 flex flex-col gap-6 bg-gradient-to-b to-transparent px-5 pt-6 pb-5">
                {/* Header: the advisors' faces and the title — nothing more */}
                <div className="flex items-center gap-3">
                    <ul role="list" aria-label={t('footer.advisors')} className="flex -space-x-2">
                        {ADVISORS.map((a) => (
                            <li key={a.id}>
                                <Avatar className="ring-card size-7 ring-2">
                                    <AvatarImage src={`/images/advisors/advisor-${a.id}.webp`} alt="" loading="lazy" />
                                    <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">{a.initials}</AvatarFallback>
                                </Avatar>
                            </li>
                        ))}
                    </ul>
                    <h2 id="estimate-recap-title" className="text-lg font-medium tracking-tight">
                        {t('estimate.recap_title')}
                    </h2>
                </div>
                {/* Progress: a hairline that darkens as the required fields come in (CSS variable → width, the only dynamic style) */}
                <div
                    role="progressbar"
                    aria-label={t('estimate.recap_progress')}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                    className="bg-secondary-30 -mt-3 h-px w-full"
                    style={{ '--progress': `${progress}%` } as CSSProperties}
                >
                    <span className="bg-foreground block h-full w-(--progress) transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none" />
                </div>
                <div aria-live="polite" className="flex flex-col">
                    {groups.map((group, index) => (
                        <section
                            key={group.title}
                            aria-labelledby={`estimate-recap-${index}`}
                            className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0"
                        >
                            {/* Gradient hairline between groups (same divider as the form steps) */}
                            {index > 0 && <GradientHairline className="mb-4" />}
                            <h3
                                id={`estimate-recap-${index}`}
                                className="text-muted-foreground mb-1 flex items-center gap-2 font-sans text-xs font-normal"
                            >
                                {isComplete(group) ? (
                                    <span className="bg-success/15 text-success animate-pop flex size-5 shrink-0 items-center justify-center rounded-full motion-reduce:animate-none">
                                        <Check aria-hidden className="size-3" strokeWidth={2.5} />
                                        <span className="sr-only">{t('estimate.recap_group_done')}</span>
                                    </span>
                                ) : (
                                    <span className="bg-grey-5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums">
                                        {index + 1}
                                    </span>
                                )}
                                {group.title}
                            </h3>
                            {/* Rows are buttons (focus the field), so a plain list rather than a <dl> */}
                            <ul role="list" className="grid grid-cols-2">
                                {group.rows.map((row, rowIndex) => {
                                    // Position among the short rows of the group: right-hand ones get a hairline on their left
                                    const shortIndex = group.rows.slice(0, rowIndex).filter((r) => r.short).length;
                                    const side = row.short ? (shortIndex % 2 === 1 ? 'border-border border-l pl-4' : 'pr-4') : '';
                                    return (
                                        <li key={row.field} className={cn('flex', row.short ? side : 'col-span-2')}>
                                            {/* The whole line is a button: click → focus the field (the "Edit" affordance is spoken, not drawn) */}
                                            <button
                                                type="button"
                                                onClick={() => focusField(row.field)}
                                                aria-label={`${t('estimate.recap_edit')} : ${row.label}`}
                                                className={cn(
                                                    'focus-ring hover:bg-background-05 -mx-2 flex flex-1 items-baseline justify-between gap-4 rounded-none px-2 py-1 text-left text-sm',
                                                )}
                                            >
                                                <span className="text-muted-foreground shrink-0">{row.label}</span>
                                                <span
                                                    className={cn(
                                                        'flex min-w-0 items-center gap-1.5 text-right',
                                                        !row.value && 'text-muted-foreground/60',
                                                    )}
                                                >
                                                    {row.count ? (
                                                        // Features: how many are ticked, like any other value (names in the accessible text / tooltip)
                                                        <>
                                                            <Check aria-hidden className="text-success size-3.5 shrink-0" />
                                                            <span className="tabular-nums" title={row.value}>
                                                                {row.count}
                                                                <span className="sr-only"> : {row.value}</span>
                                                            </span>
                                                        </>
                                                    ) : row.value ? (
                                                        <>
                                                            <Check aria-hidden className="text-success size-3.5 shrink-0" />
                                                            <span className="min-w-0 truncate">{row.value}</span>
                                                        </>
                                                    ) : (
                                                        <span aria-label={t('estimate.recap_empty')}>—</span>
                                                    )}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    ))}
                </div>
            </div>
        </aside>
    );
}
