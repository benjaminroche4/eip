import { type BuyStat } from '@/components/buy/buy-hero';
import CountryFlag from '@/components/i18n/country-flag';
import PageEyebrow from '@/components/page/page-eyebrow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useReveal } from '@/hooks/use-reveal';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Clock, Languages, type LucideIcon, MapPin } from 'lucide-react';
import { type CSSProperties, useRef } from 'react';

/** Advisor portraits (public/images/advisors), the same trio as the footer, the CTA card and the About hero. */
const ADVISORS = [
    { id: 1, initials: 'AB' },
    { id: 2, initials: 'CD' },
    { id: 3, initials: 'EF' },
] as const;

/** A fact of « Notre bilan »: `key` picks the corner mark and the value's rendering (rating = Google logo, languages = flags). */
export type BuyFact = BuyStat & { key: 'rating' | 'reply' | 'languages' | 'address' };

/** One lucide icon per fact key; the rating tile shows the Google logo (a brand logo = SVG file, not an icon) instead. */
const ICONS: Record<Exclude<BuyFact['key'], 'rating'>, LucideIcon> = { reply: Clock, languages: Languages, address: MapPin };

type BuyRecordProps = { facts: BuyFact[] };

/**
 * « Notre bilan » (Figma 712-19621 desktop / 712-20151 mobile, 2026-09-22): header with the eyebrow and h2 on the
 * left and the answer-first intro on the right (stacked and centred on mobile), then a sand « Notre engagement » card
 * (title, sentence, the three advisor portraits with their label) beside a 2×2 grid of four **facts distinct from the
 * hero's key figures** (user decision 2026-09-22, the same four numbers twice on one page read as a duplicate): the
 * real Google rating (`seo.reviews`, tile dropped without figures), the 24 h reply, FR · EN advice and the Paris 6e
 * address — plain Montserrat values (no counter: « 4,9/5 » and « FR · EN » are not counts), title, sentence and a
 * lucide icon in the corner. Every card is the site's card (sand hairline, `p-2`, inner sand gradient, square corners,
 * no shadow), rising in cascade when the block enters the viewport (`animate-hero-rise`, `--stagger` 80 ms).
 */
export default function BuyRecord({ facts }: BuyRecordProps) {
    const { t } = useTranslation();
    const ref = useRef<HTMLDivElement>(null);
    const revealed = useReveal(ref);

    const rise = (i: number) => ({
        style: { '--stagger': `${i * 80}ms` } as CSSProperties,
        className: revealed ? 'animate-hero-rise [animation-delay:var(--stagger)] motion-reduce:animate-none' : 'opacity-0 motion-reduce:opacity-100',
    });

    return (
        <section aria-labelledby="buy-record-title" className="flex flex-col gap-10 lg:gap-14">
            {/* Header (Figma 712-19622): eyebrow + h2 left, intro right and bottom-aligned on desktop; stacked and centred on mobile */}
            <div className="flex flex-col items-center gap-4 text-center lg:flex-row lg:items-end lg:justify-between lg:gap-24 lg:text-left">
                <div className="flex flex-col gap-4">
                    <PageEyebrow>{t('buy.record.eyebrow')}</PageEyebrow>
                    <h2 id="buy-record-title" className="max-w-2xl text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                        {t('buy.record.title')}
                    </h2>
                </div>
                {/* GEO: a self-contained sentence (brand + what + where) */}
                <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6 lg:max-w-sm">{t('buy.record.intro')}</p>
            </div>

            <div ref={ref} className="grid gap-5 lg:grid-cols-[2fr_3fr]">
                {/* Commitment card (Figma 712-19629): the site's card with the sand gradient filling it */}
                <div style={rise(0).style} className={cn('border-secondary-30 bg-card flex border p-2', rise(0).className)}>
                    <div className="from-background-08 to-background-05 flex w-full flex-col justify-between gap-16 bg-linear-to-b p-6 lg:gap-24 lg:p-7">
                        <div className="flex flex-col gap-3">
                            <h3 className="text-lg font-medium">{t('buy.record.commitment_title')}</h3>
                            <p className="font-heading text-lg/7 text-pretty sm:text-xl/8">{t('buy.record.commitment_text')}</p>
                        </div>
                        <div className="flex flex-col gap-4">
                            <ul role="list" aria-label={t('footer.advisors')} className="flex -space-x-2">
                                {ADVISORS.map((a) => (
                                    <li key={a.id}>
                                        <Avatar className="ring-card size-8 ring-2">
                                            <AvatarImage src={`/images/advisors/advisor-${a.id}.webp`} alt="" loading="lazy" />
                                            <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">
                                                {a.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </li>
                                ))}
                            </ul>
                            {/* The advisors' label (the Figma's « 2500+ property owners » has no source; the review count now lives in the rating tile) */}
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-medium">{t('buy.record.advisors_label')}</p>
                                <p className="text-muted-foreground text-sm">{t('buy.record.trusted_sub')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Facts (Figma 712-19656): 2×2 from sm, stacked on mobile */}
                <ul role="list" className="grid gap-5 sm:grid-cols-2">
                    {facts.map((stat, i) => {
                        const Icon = stat.key === 'rating' ? null : ICONS[stat.key];
                        return (
                            <li
                                key={stat.title}
                                style={rise(i + 1).style}
                                className={cn('border-secondary-30 bg-card flex border p-2', rise(i + 1).className)}
                            >
                                <div className="from-background-05 relative flex w-full flex-col justify-between gap-10 bg-linear-to-b to-transparent p-6">
                                    {Icon ? (
                                        <Icon aria-hidden strokeWidth={1.25} className="text-secondary-60 absolute top-6 right-6 size-7" />
                                    ) : (
                                        <img
                                            src="/images/social/google.svg"
                                            alt=""
                                            width={28}
                                            height={28}
                                            className="absolute top-6 right-6 size-7"
                                        />
                                    )}
                                    {stat.key === 'languages' ? (
                                        // Flags instead of « FR · EN » (user decision 2026-09-25); the text stays for assistive tech
                                        <p className="flex items-center gap-2">
                                            <CountryFlag country="FR" className="h-6 w-9" />
                                            <CountryFlag country="GB" className="h-6 w-9" />
                                            <span className="sr-only">{stat.value}</span>
                                        </p>
                                    ) : (
                                        <p className="font-heading text-2xl font-semibold tabular-nums sm:text-3xl">{stat.value}</p>
                                    )}
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-base font-medium text-balance">{stat.title}</h3>
                                        <p className="text-muted-foreground text-sm/6 text-pretty">{stat.text}</p>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
