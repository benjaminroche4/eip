import DistrictCards, { type BuyDistrict } from '@/components/page/district-cards';
import { useTranslation } from '@/hooks/use-translation';

export type { BuyDistrict } from '@/components/page/district-cards';

type BuyDistrictsProps = { items: BuyDistrict[] };

/** « Dans quels quartiers de Paris investir ? »: the shared `DistrictCards` block with the Buy wording (`buy.districts.*`). */
export default function BuyDistricts({ items }: BuyDistrictsProps) {
    const { t } = useTranslation();
    return (
        <DistrictCards
            id="buy-districts-title"
            items={items}
            texts={{
                eyebrow: t('buy.districts.eyebrow'),
                title: t('buy.districts.title'),
                intro: t('buy.districts.intro'),
                price_label: t('buy.districts.price_label'),
                price_source: t('buy.districts.price_source'),
            }}
        />
    );
}
