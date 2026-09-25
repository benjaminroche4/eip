import ServiceHero, { type BuyStat } from '@/components/page/service-hero';
import { useTranslation } from '@/hooks/use-translation';
import { type Ref } from 'react';

type SellHeroProps = { stats: BuyStat[]; video: string | null; ref?: Ref<HTMLElement> };

/**
 * « Vendre » hero = exactly the Buy header (user decision 2026-09-22): the shared `ServiceHero` with the Sell wording,
 * the owner's clip (`public/videos/sell/hero-*`, 2026-09-23, poster = its first frame; the Sell photo stays the fallback), the same real key figures and the valuation as the single full button.
 * The earlier trust line and proof line were dropped with it. `ref` is observed by the mobile valuation bar.
 */
export default function SellHero({ stats, video, ref }: SellHeroProps) {
    const { t } = useTranslation();
    return (
        <ServiceHero
            ref={ref}
            id="sell-title"
            href={route('estimate')}
            photo={{ src: '/images/sell/photo-{w}.jpg', widths: [800, 1600], width: 1600, height: 630 }}
            backgroundVideo={{ base: '/videos/sell/hero', poster: '/images/sell/hero-poster-1280.jpg' }}
            stats={stats}
            video={video}
            texts={{
                eyebrow: t('sell.eyebrow'),
                headline: t('sell.headline'),
                intro: t('pages.sell.intro'),
                cta: t('sell.hero_cta'),
                photo_alt: t('sell.photo_alt'),
                video_title: t('sell.video_title'),
                play_video: t('sell.play_video'),
                stats_label: t('sell.stats_label'),
            }}
        />
    );
}
