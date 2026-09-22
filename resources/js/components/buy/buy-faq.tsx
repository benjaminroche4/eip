import FaqTeaser, { type FaqTeaserData } from '@/components/page/faq-teaser';
import { useTranslation } from '@/hooks/use-translation';

export type BuyFaq = FaqTeaserData;

type BuyFaqProps = { faq: BuyFaq };

/**
 * FAQ block of the « Acheter » page, just before the closing CTA (user decision 2026-09-21): a thin wrapper around the
 * shared `FaqTeaser` (`components/page/faq-teaser.tsx`, extracted on 2026-09-22 so the « Vendre » page reuses it with
 * the « selling » topic) with the `buy.faq.*` texts, on the first six « buying » questions of the FAQ page.
 */
export default function BuyFaq({ faq }: BuyFaqProps) {
    const { t } = useTranslation();

    return (
        <FaqTeaser
            id="buy-faq-title"
            texts={{ eyebrow: t('buy.faq.eyebrow'), title: t('buy.faq.title'), intro: t('buy.faq.intro'), all: t('buy.faq.all') }}
            faq={faq}
        />
    );
}
