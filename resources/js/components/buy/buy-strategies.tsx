import NumberedSteps, { type Step, type StepPhoto } from '@/components/page/numbered-steps';
import { useTranslation } from '@/hooks/use-translation';
import { Coins, type LucideIcon, ShieldCheck, TrendingUp } from 'lucide-react';

export type BuyStrategy = Step;

type BuyStrategiesProps = {
    /** The three strategies (`buy.strategies.items`, prop of the controller). */
    items: BuyStrategy[];
};

/** One lucide icon per strategy, in order (the Figma's line-chart / coins / shield glyphs). */
const ICONS: LucideIcon[] = [TrendingUp, Coins, ShieldCheck];

/** One photo per strategy, `public/images/buy/strategies-{1,2,3}-{800,1600}.jpg` (placeholders: 1 = the Figma terrace, 2 and 3 = copies of the success stories photos, to replace by three distinct subjects). */
const PHOTOS: StepPhoto[] = [1, 2, 3].map((i) => ({ src: `/images/buy/strategies-${i}-{w}.jpg`, alt: '' }));

/**
 * « Des stratégies conçues autour de vos objectifs » (Figma 712-18511 desktop / 712-18821 mobile), under the buy hero:
 * a thin wrapper around the shared `NumberedSteps` block (`components/page/numbered-steps.tsx`, extracted on
 * 2026-09-22 so the « Vendre » page reuses it for its three steps) with the `buy.strategies.*` texts, the Buy photos
 * and the Figma's line-chart / coins / shield icons.
 */
export default function BuyStrategies({ items }: BuyStrategiesProps) {
    const { t } = useTranslation();

    return (
        <NumberedSteps
            id="buy-strategies-title"
            texts={{ eyebrow: t('buy.strategies.eyebrow'), title: t('buy.strategies.title'), intro: t('buy.strategies.intro') }}
            items={items}
            photos={PHOTOS.map((p, i) => (i === 0 ? { ...p, alt: t('buy.strategies.photo_alt') } : p))}
            icons={ICONS}
        />
    );
}
