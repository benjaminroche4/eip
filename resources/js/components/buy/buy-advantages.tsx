import AdvantageCards, { type AdvantageCard } from '@/components/page/advantage-cards';
import { useTranslation } from '@/hooks/use-translation';
import { ChartLine, Globe, House, type LucideIcon, UserCheck } from 'lucide-react';

/** The four reasons (Figma 712-18480, reworked 2026-09-21): sourcing, figures-based analysis, negotiation, international buyers. */
const ADVANTAGES: { key: 'sourcing' | 'analysis' | 'negotiation' | 'international'; icon: LucideIcon }[] = [
    { key: 'sourcing', icon: House },
    { key: 'analysis', icon: ChartLine },
    { key: 'negotiation', icon: UserCheck },
    { key: 'international', icon: Globe },
];

/**
 * « Pourquoi acheter avec Estate in Paris ? » (Figma 712-18480 desktop / 712-18794 mobile), under the « Acheter » hero:
 * a thin wrapper around the shared `AdvantageCards` block (`components/page/advantage-cards.tsx`, extracted on
 * 2026-09-22 so the « Vendre » page reuses it) with the `buy.why_*` texts and an outline « Parler à un conseiller »
 * button to contact — the page's primary action (full button) stays in the hero and in the closing CTA card.
 */
export default function BuyAdvantages() {
    const { t } = useTranslation();
    const items: AdvantageCard[] = ADVANTAGES.map(({ key, icon }) => ({ icon, title: t(`buy.why_${key}_title`), text: t(`buy.why_${key}_text`) }));

    return (
        <AdvantageCards
            id="buy-advantages-title"
            eyebrow={t('buy.why_eyebrow')}
            title={t('buy.why_title')}
            intro={t('buy.why_intro')}
            items={items}
            cta={{ href: route('contact'), label: t('buy.why_cta') }}
        />
    );
}
