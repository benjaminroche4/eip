import PageEyebrow from '@/components/page/page-eyebrow';
import OffMarketGate from '@/components/properties/off-market-gate';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { ordinal } from '@/lib/ordinal';

type LockedProps = {
    /** The confidential listing behind the gate, by kind only (null on the selection page). */
    teaser: { type: string; transaction: 'sale' | 'rent'; arrondissement: number } | null;
};

/**
 * The gate of the off-market listings (user decision 2026-09-29): rendered in place of a confidential detail page,
 * and of the off-market selection, until the session is unlocked. `noindex`; says only the listing's kind and
 * arrondissement; the six-digit code field (`OffMarketGate`) and the way to ask for one.
 */
export default function PropertyLockedPage({ teaser }: LockedProps) {
    const { t, locale } = useTranslation();

    return (
        <>
            <SeoHead title={t('pages.off_market.seo_title')} description={t('pages.off_market.seo_description')} noindex />
            <PublicLayout className="max-w-3xl">
                <div className="flex flex-col gap-10">
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
                    {/* The site's card: sand hairline, white surface */}
                    <div className="border-secondary-30 bg-card border p-6 sm:p-8">
                        <OffMarketGate />
                    </div>
                </div>
            </PublicLayout>
        </>
    );
}
