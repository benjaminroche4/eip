import BuyAdvantages from '@/components/buy/buy-advantages';
import BuyDistricts, { type BuyDistrict } from '@/components/buy/buy-districts';
import BuyFaq, { type BuyFaq as BuyFaqData } from '@/components/buy/buy-faq';
import BuyHero, { type BuyStat } from '@/components/buy/buy-hero';
import BuyRecord from '@/components/buy/buy-record';
import BuyStrategies, { type BuyStrategy } from '@/components/buy/buy-strategies';
import CtaCard from '@/components/home/cta-card';
import Testimonials, { type Testimonial } from '@/components/home/testimonials';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { stripFaqMarkup } from '@/lib/faq-markup';
import { breadcrumbList, faqPage } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type BuyProps = {
    stats: BuyStat[];
    video: string | null;
    strategies: BuyStrategy[];
    districts: BuyDistrict[];
    testimonials: Testimonial[];
    faq: BuyFaqData;
    /** « Notre bilan »: four facts distinct from the hero figures (BuyController::facts). */
    facts: BuyStat[];
};

/** « Acheter » (Figma 712-18453 / 712-18766): hero with the key figures and an optional presentation video, then « Pourquoi Estate in Paris » (712-18480 / 712-18794) the investment strategies (712-18511 / 712-18821) the prime districts (712-18574 / 712-18884), the home testimonials (proof), the track record (712-19621 / 712-20151) and the FAQ. Conversion rhythm (2026-09-22): the single primary action « Parler à un conseiller » → contact is a full button in the hero and on the closing card only; every call to action in between is outline. */
export default function Buy({ stats, video, strategies, districts, testimonials, faq, facts }: BuyProps) {
    const { t } = useTranslation();
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('pages.buy.title'), url: route('buy') },
    ];

    return (
        <PublicLayout className="flex max-w-7xl flex-col gap-20 sm:gap-28">
            <SeoHead
                title={t('pages.buy.seo_title')}
                description={t('pages.buy.seo_description')}
                jsonLd={[breadcrumbList(crumbs, origin), faqPage(faq.items.map((i) => ({ question: i.question, answer: stripFaqMarkup(i.answer) })))]}
            />
            <BuyHero stats={stats} video={video} />
            <BuyAdvantages />
            <BuyStrategies items={strategies} />
            <BuyDistricts items={districts} />
            {/* The home's reviews block (proof, 2026-09-22): its sand band spans the whole viewport, as on the About page */}
            <div className="relative left-1/2 w-screen -translate-x-1/2">
                <Testimonials items={testimonials} />
            </div>
            {/* Track record (Figma 712-19621 / 712-20151): commitment card + the four key figures, before the FAQ */}
            <BuyRecord facts={facts} />
            <BuyFaq faq={faq} />
            {/* Same closing call to action as the home and About pages, at the home's width */}
            <div className="mx-auto w-full max-w-5xl">
                <CtaCard />
            </div>
        </PublicLayout>
    );
}
