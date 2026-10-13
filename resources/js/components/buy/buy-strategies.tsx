import NumberedSteps, { type Step, type StepPhoto } from '@/components/page/numbered-steps';
import { useTranslation } from '@/hooks/use-translation';

export type BuyStrategy = Step;

type BuyStrategiesProps = {
    /** The three strategies (`buy.strategies.items`, prop of the controller). */
    items: BuyStrategy[];
};

/** One photo per step: three interiors provided by the user for the Buy page (2026-10-12), `public/images/buy/process-{1,2,3}-{800,1600}.webp` (WebP q80 from 2048 px PNGs), distinct from the Sell ones. */
const PHOTOS: StepPhoto[] = [1, 2, 3].map((i) => ({ src: `/images/buy/process-${i}-{w}.webp`, alt: '' }));

/**
 * « Comment vous accompagnons-nous jusqu'aux clés ? » (Figma 712-18511 desktop / 712-18821 mobile, the former « strategies » block), under the buy hero:
 * a thin wrapper around the shared `NumberedSteps` block (`components/page/numbered-steps.tsx`, extracted on
 * 2026-09-22 so the « Vendre » page reuses it for its three steps) with the `buy.strategies.*` texts (the buyer's three
 * support steps since 2026-10-12) and the Buy photos.
 */
export default function BuyStrategies({ items }: BuyStrategiesProps) {
    const { t } = useTranslation();

    return (
        <NumberedSteps
            id="buy-strategies-title"
            texts={{ eyebrow: t('buy.strategies.eyebrow'), title: t('buy.strategies.title'), intro: t('buy.strategies.intro') }}
            items={items}
            photos={PHOTOS.map((p, i) => (i === 0 ? { ...p, alt: t('buy.strategies.photo_alt') } : p))}
        />
    );
}
