import ServiceHero, { type BuyStat } from '@/components/page/service-hero';
import { useTranslation } from '@/hooks/use-translation';

export type { BuyStat } from '@/components/page/service-hero';

type BuyHeroProps = { stats: BuyStat[]; video: string | null };

/** « Acheter » hero: the shared `ServiceHero` with the Buy wording, the home façade photo and the contact as target. */
export default function BuyHero({ stats, video }: BuyHeroProps) {
    const { t } = useTranslation();
    return (
        <ServiceHero
            id="buy-title"
            href={route('contact')}
            photo={{ src: '/images/home/hero-{w}.jpg', widths: [800, 1200, 2000, 2800], width: 2000, height: 1269 }}
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
