import { type BuyStat } from '@/components/buy/buy-hero';
import PageEyebrow from '@/components/page/page-eyebrow';
import StatValue from '@/components/page/stat-value';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useReveal } from '@/hooks/use-reveal';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Coins, FileCheck, type LucideIcon, ReceiptText, UserCheck } from 'lucide-react';
import { type CSSProperties, useRef } from 'react';

/** Advisor portraits (public/images/advisors), the same trio as the footer, the CTA card and the About hero. */
const ADVISORS = [
    { id: 1, initials: 'AB' },
    { id: 2, initials: 'CD' },
    { id: 3, initials: 'EF' },
] as const;

/** One lucide icon per figure, in the order of `about.stats` (transactions, years, properties, buyers) — the Figma's coins / user-check / receipt-check / sticker glyphs. */
const ICONS: LucideIcon[] = [Coins, UserCheck, ReceiptText, FileCheck];

type BuyRecordProps = { stats: BuyStat[] };

/**
 * « Notre bilan » (Figma 712-19621 desktop / 712-20151 mobile, 2026-09-22): header with the eyebrow and h2 on the
 * left and the answer-first intro on the right (stacked and centred on mobile), then a sand « Notre engagement » card
 * (title, sentence, the three advisor portraits and the real Google review count as the proof line — hidden without
 * figures, never a made-up « 2 500+ ») beside a 2×2 grid of the agency's four key figures (`about.stats`, the same
 * real numbers as the About page and the « Acheter » hero): Montserrat value counting up (`StatValue`), title,
 * sentence, and the lucide icon in the top-right corner. Every card is the site's card (sand hairline, `p-2`, inner
 * sand gradient, square corners, no shadow — the Figma's rounded sand / grey tiles adapted to the DA), rising in
 * cascade when the block enters the viewport (`animate-hero-rise`, `--stagger` 80 ms, `motion-reduce` cancels).
 */
export default function BuyRecord({ stats }: BuyRecordProps) {
    const { t, tc } = useTranslation();
    const { seo } = usePage<SharedData>().props;
    const reviews = seo.reviews;
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
                            {/* Proof line: the real Google review count (the Figma's « 2500+ property owners » has no source) */}
                            {reviews && (
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm font-medium">
                                        {tc('buy.record.trusted', reviews.count, { count: reviews.count.toLocaleString('fr-FR') })}
                                    </p>
                                    <p className="text-muted-foreground text-sm">{t('buy.record.trusted_sub')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Key figures (Figma 712-19656): 2×2 from sm, stacked on mobile */}
                <ul role="list" className="grid gap-5 sm:grid-cols-2">
                    {stats.map((stat, i) => {
                        const Icon = ICONS[i % ICONS.length];
                        return (
                            <li
                                key={stat.title}
                                style={rise(i + 1).style}
                                className={cn('border-secondary-30 bg-card flex border p-2', rise(i + 1).className)}
                            >
                                <div className="from-background-05 relative flex w-full flex-col justify-between gap-10 bg-linear-to-b to-transparent p-6">
                                    <Icon aria-hidden strokeWidth={1.25} className="text-secondary-60 absolute top-6 right-6 size-7" />
                                    <p className="font-heading text-2xl font-semibold tabular-nums sm:text-3xl">
                                        <StatValue value={stat.value} run={revealed} />
                                    </p>
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
