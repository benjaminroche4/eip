import CtaCard from '@/components/home/cta-card';
import SuccessStories, { type SuccessStory } from '@/components/home/success-stories';
import Testimonials, { type Testimonial } from '@/components/home/testimonials';
import AdvantageCards, { type AdvantageCard } from '@/components/page/advantage-cards';
import FaqTeaser, { type FaqTeaserData } from '@/components/page/faq-teaser';
import FeatureSplit from '@/components/page/feature-split';
import NumberedSteps, { type Step } from '@/components/page/numbered-steps';
import { type BuyStat } from '@/components/page/service-hero';
import SellHero from '@/components/sell/sell-hero';
import SellMobileCta from '@/components/sell/sell-mobile-cta';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { stripFaqMarkup } from '@/lib/faq-markup';
import { breadcrumbList, faqPage } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Camera, ChartLine, Handshake, Search, Sparkles, Users, UsersRound } from 'lucide-react';
import { useRef } from 'react';

type SellProps = { stories: SuccessStory[]; steps: Step[]; testimonials: Testimonial[]; faq: FaqTeaserData; stats: BuyStat[]; video: string | null };

/** The four reasons to sell with the agency (`sell.why_*`): valuation, presentation, buyers, negotiation — one fact each. */
const ADVANTAGES = [
    { key: 'valuation', icon: ChartLine },
    { key: 'exposure', icon: Camera },
    { key: 'buyers', icon: Users },
    { key: 'negotiation', icon: Handshake },
] as const;

/**
 * « Vendre » (2026-09-22), composed from the site's blocks with a conversion rhythm — emotion / reason / proof /
 * objection / action, each block ending on what the next one answers (the h2 are questions, GEO): hero (`SellHero` =
 * exactly the Buy header: eyebrow + h1, intro + « Faire estimer mon bien », photo panel with the key figures) → « Pourquoi
 * vendre avec Estate in Paris ? » (`AdvantageCards`, outline valuation button) → « Comment vendons-nous votre bien ? »
 * (`NumberedSteps`, the Buy strategies block extracted: three numbered steps, photos = the Buy placeholders) → the confidential sale in text + photo (`FeatureSplit`, two columns) → the home's photo row
 * (`SuccessStories` without the quote, emotion) → the home testimonials (proof, full-width band) → the FAQ « selling » topic (`FaqTeaser`, objections) → the CTA card
 * pointed at the valuation. Only the hero and the closing card carry a full button; no « Nous contacter » on this
 * page (the contact stays in the header / footer). On mobile a fixed bar (`SellMobileCta`) keeps the valuation one
 * tap away between the hero and the closing card. Sections spaced like « Acheter » (`gap-20 sm:gap-28`).
 */
export default function Sell({ stories, steps, testimonials, faq, stats, video }: SellProps) {
    const { t } = useTranslation();
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('pages.sell.title'), url: route('sell') },
    ];
    const heroRef = useRef<HTMLElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const advantages: AdvantageCard[] = ADVANTAGES.map(({ key, icon }) => ({
        icon,
        title: t(`sell.why_${key}_title`),
        text: t(`sell.why_${key}_text`),
    }));

    return (
        <PublicLayout className="flex max-w-7xl flex-col gap-20 sm:gap-28">
            <SeoHead
                title={t('pages.sell.seo_title')}
                description={t('pages.sell.seo_description')}
                jsonLd={[breadcrumbList(crumbs, origin), faqPage(faq.items.map((i) => ({ question: i.question, answer: stripFaqMarkup(i.answer) })))]}
            />
            {/* Exactly the Buy header (user decision 2026-09-22): shared `ServiceHero`, valuation as the single full button */}
            <SellHero ref={heroRef} stats={stats} video={video} />

            <AdvantageCards
                id="sell-advantages-title"
                eyebrow={t('sell.why_eyebrow')}
                title={t('sell.why_title')}
                intro={t('sell.why_intro')}
                items={advantages}
                cta={{ href: route('estimate'), label: t('sell.why_cta') }}
            />

            {/* The three steps of the sale, in the Buy strategies block `NumberedSteps` (numbered list, scroll lock-in, cross-fading photos).
                Photos: the Buy placeholders `public/images/buy/strategies-{1,2,3}` for now, to replace by three sale subjects. */}
            <NumberedSteps
                id="sell-process-title"
                items={steps}
                texts={{ eyebrow: t('sell.process.eyebrow'), title: t('sell.process.title'), intro: t('sell.process.intro') }}
                photos={[1, 2, 3].map((i) => ({ src: `/images/buy/strategies-${i}-{w}.jpg`, alt: i === 1 ? t('sell.process.photo_alt') : '' }))}
                icons={[Search, Sparkles, UsersRound]}
            />

            {/* Confidential sale, text + photo in two columns (user decision 2026-09-22, replaces the district cards tried the same day) */}
            <FeatureSplit
                id="sell-confidential-title"
                eyebrow={t('sell.confidential.eyebrow')}
                title={t('sell.confidential.title')}
                intro={t('sell.confidential.intro')}
                points={[1, 2, 3].map((n) => t(`sell.confidential.point_${n}`))}
                image={{
                    src: '/images/stories/story-2-1600.jpg',
                    srcSet: '/images/stories/story-2-800.jpg 800w, /images/stories/story-2-1600.jpg 1600w',
                    alt: t('sell.confidential.photo_alt'),
                    height: 1142,
                }}
            />

            {/* The home's photo row (success stories, photos only, draggable, arrows), in place of the former mosaic — user decision 2026-09-22 */}
            <SuccessStories stories={stories} quote={false} embedded />

            {/* The home's reviews block (proof): its sand band spans the whole viewport, as on the About and Buy pages */}
            <div className="relative left-1/2 w-screen -translate-x-1/2">
                <Testimonials items={testimonials} />
            </div>

            <FaqTeaser
                id="sell-faq-title"
                faq={faq}
                texts={{ eyebrow: t('sell.faq.eyebrow'), title: t('sell.faq.title'), intro: t('sell.faq.intro'), all: t('sell.faq.all') }}
            />

            {/* Closing action, pointed at the valuation (the page's single primary action), at the home's width */}
            <div ref={endRef} className="mx-auto w-full max-w-5xl">
                <CtaCard title={t('sell.cta_title')} text={t('sell.cta_text')} button={t('sell.cta_button')} href={route('estimate')} />
            </div>

            <SellMobileCta after={heroRef} until={endRef} />
        </PublicLayout>
    );
}
