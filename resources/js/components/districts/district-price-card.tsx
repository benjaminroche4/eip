import { type District } from '@/components/districts/paris-map';
import GradientHairline from '@/components/layout/gradient-hairline';
import StatValue from '@/components/page/stat-value';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { ordinal } from '@/lib/ordinal';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, MapPin, Users, Wallet } from 'lucide-react';

type DistrictPriceCardProps = {
    d: District;
    /** Run the counter, from `from` (the previous arrondissement's price) to this one. */
    run: boolean;
    from: number;
    /** Rank of the price among the 20 (1 = dearest), its distance to the dearest in % and the dearest itself. */
    rank: number;
    total: number;
    pct: number;
    dearest: District;
    className?: string;
};

/** Reference floor area of the budget line, a typical Paris family apartment. */
const BUDGET_AREA = 60;

/** « 9 700 » → 9700 (rounded prices from ui.php). */
const priceOf = (d: District) => Number(d.price.replace(/\D/g, ''));

/** « Paris 6e » / « Paris 6th » → « 6e » / « 6th » for « sous le 6e » / « below the 6th ». */
const shortName = (d: District) => d.name.replace(/^Paris\s+/, '');

/* ————— Pieces ————— */

function Label({ children, className }: { children: string; className?: string }) {
    return <p className={cn('text-muted-foreground text-xs font-medium tracking-wider uppercase', className)}>{children}</p>;
}

/** The price in the language's format (« 9 700 € » / « €9,700 », `districts.price_format`), the unit after. */
function Price({ d, run, from, className }: { d: District; run: boolean; from: number; className?: string }) {
    const { t } = useTranslation();
    return (
        <p className={cn('font-heading text-4xl font-semibold tabular-nums', className)}>
            <StatValue value={t('districts.price_format', { price: d.price })} run={run} from={from} />
            <span className="text-muted-foreground text-base font-normal"> {t('districts.per_m2')}</span>
        </p>
    );
}

/**
 * Rank read as a buyer would (user decision 2026-09-25): the dearer half counts from the top (« 3e prix le plus élevé
 * de Paris »), the cheaper half from the bottom (« 5e arrondissement le plus abordable »), the two ends by name; then
 * the distance to the dearest, named (« 33 % sous le 6e »).
 */
function Context({ rank, total, pct, dearest, className }: { rank: number; total: number; pct: number; dearest: District; className?: string }) {
    const { t } = useTranslation();
    const { localization } = usePage<SharedData>().props;
    const fromBottom = total - rank + 1;
    const position =
        rank === 1
            ? t('districts.price_max')
            : rank === total
              ? t('districts.price_min')
              : rank <= total / 2
                ? t('districts.rank_dearest', { rank: ordinal(rank, localization.current) })
                : t('districts.rank_cheapest', { rank: ordinal(fromBottom, localization.current) });
    return (
        <p className={cn('text-muted-foreground text-sm', className)}>
            {position}
            {pct > 0 && (
                <>
                    {' · '}
                    {t('districts.price_vs_max', { pct, name: shortName(dearest) })}
                </>
            )}
        </p>
    );
}

function useBudget(d: District): string {
    const { t } = useTranslation();
    const { localization } = usePage<SharedData>().props;
    const locale = localization.current === 'fr' ? 'fr-FR' : 'en-GB';
    return t('districts.price_format', { price: (priceOf(d) * BUDGET_AREA).toLocaleString(locale) });
}

function Cta({ d, className }: { d: District; className?: string }) {
    const { t } = useTranslation();
    return (
        <Button asChild size="lg" className={cn('w-full', className)}>
            <Link href={route('contact', { district: d.n })} prefetch>
                {t('districts.cta')}
                <ArrowUpRight aria-hidden />
            </Link>
        </Button>
    );
}

/**
 * Price card of the arrondissement profile (ui.sh variant « Étiquette de prix » chosen among 20, user decision
 * 2026-09-25): label, the price per m² in a white square chip with a sand hairline (the counter rolls from the previous arrondissement's price),
 * rank read as a buyer would and distance to the dearest, hairline, then three icon rows (budget for 60 m², districts,
 * buyer profile with the audience sentence — variant « Rangées à icônes » chosen among 5 the same day) and the contact
 * button carrying `?district=N`. Sticky right column from `lg`, first on mobile.
 */
export default function DistrictPriceCard({ d, run, from, rank, total, pct, dearest, className }: DistrictPriceCardProps) {
    const { t } = useTranslation();
    const ctx = { rank, total, pct, dearest };
    const frame = cn('border-secondary-30 bg-card flex border p-2', className);

    const budget = useBudget(d);
    const head = (
        <div className="flex flex-col gap-3">
            <Label>{t('districts.price_label')}</Label>
            <div className="border-secondary-30 bg-card self-start border px-4 py-2">
                <Price d={d} run={run} from={from} className="text-3xl" />
            </div>
            <Context {...ctx} />
        </div>
    );
    return (
        <div className={frame}>
            {/* The price sits in a white square chip with a sand hairline, like the date chip of the legal pages — ui.sh variant
                « Étiquette de prix » chosen among 20 (user decision 2026-09-25, « la 2 » first, then « la 20 pardon ») */}
            <div className="from-background-08 to-background-05 flex w-full flex-col gap-6 bg-linear-to-b p-6">
                {head}
                <GradientHairline />
                {/* Facts as icon rows (ui.sh variant « Rangées à icônes » chosen among 5, user decision 2026-09-25): a sand-hairline
                    icon tile per fact, label above the value, the note under it — budget for 60 m², districts, buyer profile + audience */}
                <dl className="flex flex-col gap-4">
                    {(
                        [
                            {
                                icon: Wallet,
                                label: t('districts.budget_label', { area: BUDGET_AREA }),
                                value: t('districts.budget_value', { amount: budget }),
                                note: t('districts.budget_note'),
                            },
                            { icon: MapPin, label: t('districts.areas_label'), value: d.areas, note: null },
                            { icon: Users, label: t('districts.profile_label'), value: d.profile, note: d.audience },
                        ] as const
                    ).map((row) => (
                        // The tile lives in the <dt> (a <dl> group holds only dt / dd — axe `definition-list`), the values indent under the label
                        <div key={row.label} className="flex flex-col gap-0.5">
                            <dt className="text-muted-foreground flex items-center gap-3 text-xs">
                                <span
                                    aria-hidden
                                    className="border-secondary-30 bg-card text-foreground flex size-9 shrink-0 items-center justify-center border"
                                >
                                    <row.icon className="size-4" strokeWidth={1.5} />
                                </span>
                                {row.label}
                            </dt>
                            <dd className="pl-12 text-sm font-medium tabular-nums">{row.value}</dd>
                            {row.note && <dd className="text-muted-foreground pl-12 text-xs text-pretty">{row.note}</dd>}
                        </div>
                    ))}
                </dl>
                <Cta d={d} />
            </div>
        </div>
    );
}
