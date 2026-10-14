import PageEyebrow from '@/components/page/page-eyebrow';
import OffMarketGate from '@/components/properties/off-market-gate';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { ordinal } from '@/lib/ordinal';
import { LockKeyhole } from 'lucide-react';

type LockedProps = {
    /** The confidential listing behind the gate, by kind only (null on the selection page). */
    teaser: { type: string; transaction: 'sale' | 'rent'; arrondissement: number; slug: string } | null;
};

/**
 * The gate of the off-market listings (user decision 2026-09-29): rendered in place of a confidential detail page,
 * and of the off-market selection, until the session is unlocked. `noindex`; says only the listing's kind and
 * arrondissement; the four-digit code field (`OffMarketGate`) and the way to ask for one.
 * Layout = ui.sh variant « Ticket » chosen among 16 on 2026-10-14 (user decision): one sand-lined card, a sand header
 * strip with the lock in a white disc, a dashed hairline like a tear-off, then the form.
 */
export default function PropertyLockedPage({ teaser }: LockedProps) {
    const { t, locale } = useTranslation();

    return (
        <>
            <SeoHead title={t('pages.off_market.seo_title')} description={t('pages.off_market.seo_description')} noindex />
            <PublicLayout className="max-w-3xl">
                <div className="border-secondary-30 bg-card mx-auto w-full max-w-lg border">
                    <div className="bg-background-05 flex items-start gap-4 p-6 sm:p-8">
                        <span
                            aria-hidden
                            className="border-secondary-30 bg-card flex size-14 shrink-0 items-center justify-center rounded-full border"
                        >
                            <LockKeyhole className="size-6" strokeWidth={1.25} />
                        </span>
                        <div className="flex flex-col gap-4">
                            <PageEyebrow>{t('off_market.locked_eyebrow')}</PageEyebrow>
                            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                                {teaser ? t('off_market.locked_title') : t('off_market.locked_title_selection')}
                            </h1>
                            {/* GEO: a self-contained sentence, nothing that identifies the listing */}
                            <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">
                                {teaser ? t('off_market.locked_intro') : t('off_market.locked_intro_selection')}
                            </p>
                            {teaser && (
                                <p className="text-sm font-medium">
                                    {t('off_market.locked_teaser', {
                                        type: t(`properties.types.${teaser.type}`),
                                        transaction: t(`properties.transaction.${teaser.transaction}`),
                                        arrondissement: ordinal(teaser.arrondissement, locale),
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                    {/* The tear-off line of the ticket */}
                    <div className="border-secondary-30 border-t border-dashed" aria-hidden />
                    <div className="p-6 sm:p-8">
                        <OffMarketGate property={teaser?.slug ?? null} />
                    </div>
                </div>
            </PublicLayout>
        </>
    );
}
