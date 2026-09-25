import ServiceHero, { type BuyStat } from '@/components/page/service-hero';
import { useTranslation } from '@/hooks/use-translation';

export type { BuyStat } from '@/components/page/service-hero';

type BuyHeroProps = { stats: BuyStat[]; video: string | null };

/** « Acheter » hero: the shared `ServiceHero` with the Buy wording, the owner's interior clip as the panel (2026-09-23, poster = its first frame; the façade photo stays the fallback) and the contact as target. */
export default function BuyHero({ stats, video }: BuyHeroProps) {
    const { t } = useTranslation();
    return (
        <ServiceHero
            id="buy-title"
            href={route('contact')}
            photo={{ src: '/images/home/hero-{w}.jpg', widths: [800, 1200, 2000, 2800], width: 2000, height: 1269 }}
            backgroundVideo={{ base: '/videos/buy/hero', poster: '/images/buy/hero-poster-1280.jpg' }}
            stats={stats}
            video={video}
            texts={{
                eyebrow: t('buy.eyebrow'),
                headline: t('buy.headline'),
                intro: t('pages.buy.intro'),
                cta: t('buy.cta'),
                photo_alt: t('buy.photo_alt'),
                video_title: t('buy.video_title'),
                play_video: t('buy.play_video'),
                stats_label: t('buy.stats_label'),
            }}
        />
    );
}
