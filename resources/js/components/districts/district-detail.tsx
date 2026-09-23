import { type District } from '@/components/districts/paris-map';
import GradientHairline from '@/components/layout/gradient-hairline';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Building2, Lightbulb, type LucideIcon, Sparkles, Users } from 'lucide-react';

type DistrictDetailProps = { items: District[]; selected: number | null; /** Layout override of the root. */ className?: string };

/** The four text rows on the left, each with its lucide icon in the site's square tile. */
const ROWS: { key: 'positives' | 'audience' | 'housing' | 'extra'; icon: LucideIcon; label: string }[] = [
    { key: 'positives', icon: Sparkles, label: 'districts.positives_label' },
    { key: 'audience', icon: Users, label: 'districts.audience_label' },
    { key: 'housing', icon: Building2, label: 'districts.housing_label' },
    { key: 'extra', icon: Lightbulb, label: 'districts.extra_label' },
];

/**
 * Detail block under the hero map (2026-09-22, reworked 2026-09-23 on user request « la card à droite et le texte à
 * gauche avec des icônes »): two columns from `lg` — on the left the selected arrondissement's story as four rows
 * that catch the eye, each with a lucide icon in the site's square tile (strengths as a check list, who it suits,
 * housing types, worth knowing), on the right the site's card (sticky) with the name, districts, the price per m²
 * in large, the profile chip and a contact button. All 20 blocks are in the HTML (`hidden` except the selected one,
 * ids `arrondissement-N` for the JSON-LD anchors); a placeholder shows while nothing is selected (`aria-live`).
 */
export default function DistrictDetail({ items, selected, className }: DistrictDetailProps) {
    const { t } = useTranslation();

    return (
        <div aria-live="polite" className={cn('flex w-full flex-col', className)}>
            {selected === null && (
                <div className="border-secondary-30 bg-card mx-auto flex w-full max-w-4xl border p-2">
                    <p className="from-background-05 text-muted-foreground w-full bg-linear-to-b to-transparent px-6 py-12 text-center text-sm text-pretty">
                        {t('districts.detail_placeholder')}
                    </p>
                </div>
            )}
            {items.map((d) => (
                <section
                    key={d.n}
                    id={`arrondissement-${d.n}`}
                    aria-labelledby={`arrondissement-${d.n}-title`}
                    hidden={d.n !== selected}
                    className={cn('flex-col gap-10 lg:grid lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-16', d.n === selected && 'flex')}
                >
                    {/* Left: the story, four iconed rows */}
                    <div className="flex flex-col gap-2">
                        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{t('districts.detail_title')}</p>
                        <h3 id={`arrondissement-${d.n}-title`} className="text-2xl font-medium tracking-tight sm:text-3xl">
                            {d.name}
                        </h3>
                        <p className="text-muted-foreground text-base/7 sm:text-sm/6">{d.areas}</p>
                        <ul role="list" className="mt-6 flex flex-col">
                            {ROWS.map(({ key, icon: Icon, label }, i) => (
                                <li key={key} className="flex flex-col">
                                    {i > 0 && <GradientHairline className="my-5" />}
                                    <div className="flex gap-4">
                                        <span
                                            aria-hidden
                                            className="border-secondary-30 bg-card flex size-11 shrink-0 items-center justify-center border"
                                        >
                                            <Icon className="size-5" strokeWidth={1.5} />
                                        </span>
                                        <div className="flex min-w-0 flex-col gap-2">
                                            <h4 className="text-base font-medium">{t(label)}</h4>
                                            {key === 'positives' ? (
                                                <ul role="list" className="flex flex-col gap-1.5 text-sm/6">
                                                    {d.positives.map((point) => (
                                                        <li key={point} className="flex items-start gap-2">
                                                            <span aria-hidden className="bg-secondary-60 mt-2.5 size-1.5 shrink-0 rounded-full" />
                                                            {point}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-muted-foreground text-sm/6 text-pretty">{d[key]}</p>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right: the site's card with the facts and the action */}
                    <div className="border-secondary-30 bg-card flex border p-2 lg:sticky lg:top-24">
                        <div className="from-background-08 to-background-05 flex w-full flex-col gap-6 bg-linear-to-b p-6">
                            <div className="flex flex-col gap-1">
                                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{t('districts.price_label')}</p>
                                <p className="font-heading text-4xl font-semibold tabular-nums">
                                    {d.price} €<span className="text-muted-foreground text-base font-normal"> /m²</span>
                                </p>
                            </div>
                            <GradientHairline />
                            <dl className="flex flex-col gap-3 text-sm">
                                <div className="flex items-baseline justify-between gap-4">
                                    <dt className="text-muted-foreground">{t('districts.profile_label')}</dt>
                                    <dd className="bg-background-08 px-2 py-0.5 text-xs font-medium">{d.profile}</dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-4">
                                    <dt className="text-muted-foreground">{t('districts.col_district')}</dt>
                                    <dd className="font-medium">{d.name}</dd>
                                </div>
                            </dl>
                            <Button asChild size="lg" className="w-full">
                                <Link href={route('contact')} prefetch>
                                    {t('districts.cta')}
                                    <ArrowUpRight aria-hidden />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
}
