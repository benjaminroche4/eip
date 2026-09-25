import AgencyManifesto from '@/components/about/agency-manifesto';
import BlogRelated from '@/components/blog/blog-related';
import { type BlogPostSummary } from '@/components/blog/types';
import CtaCard from '@/components/home/cta-card';
import Hero from '@/components/home/hero';
import Services from '@/components/home/services';
import SuccessStories, { type SuccessStory } from '@/components/home/success-stories';
import Testimonials, { type Testimonial } from '@/components/home/testimonials';
import TrustIntro from '@/components/home/trust-intro';
import FaqTeaser, { type FaqTeaserData } from '@/components/page/faq-teaser';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { stripFaqMarkup } from '@/lib/faq-markup';
import { faqPage, siteGraph } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type HomeProps = {
    testimonials: Testimonial[];
    stories: SuccessStory[];
    figure: string;
    posts: BlogPostSummary[];
    faq: FaqTeaserData;
};

/** Width of the blocks that do not carry their own column (the layout's `main` has none in hero mode). */
const columnClass = 'mx-auto w-full max-w-7xl px-6 py-16 sm:py-20 lg:px-8';

/**
 * Home page (2026-09-22, conversion order — user decision): one funnel from attention to action, every h2 a question
 * the next block answers (GEO), a single full button at the top (hero) and at the bottom (closing card), proof and
 * data in the middle to keep the visitor scrolling:
 * 1. `Hero` — promise + « Contacter un conseiller » + the three commitments;
 * 2. `TrustIntro` — real figure, advisors, Google rating, « Découvrir nos biens » / contact (immediate credibility);
 * 3. `Services` — « que pouvons-nous faire pour vous ? »: the visitor picks buy / sell / value / support (self-segmentation);
 * 4. `AgencyManifesto` — « qui sommes-nous ? »: the About manifesto in text only (the figures stay on About / Buy);
 * 5. `SuccessStories` — « quels résultats ? »: the photo carousel alone (rational + emotional proof);
 * 6. `Testimonials` — « que disent nos clients ? »: social proof band;
 * 7. `FaqTeaser` — « comment travaille-t-on avec nous ? »: the « working » topic lifts the last objections;
 * 8. `BlogRelated` — expertise and a soft exit for those who are not ready (hidden without articles);
 * 9. `CtaCard` — the action.
 */
export default function Home({ testimonials, stories, figure, posts, faq }: HomeProps) {
    const { seo, ziggy } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const origin = new URL(ziggy.location).origin;

    return (
        <>
            <SeoHead
                title={t('home.seo_title')}
                withSuffix={false}
                description={t('home.seo_description')}
                jsonLd={[
                    ...siteGraph(seo, origin, route('search')),
                    faqPage(faq.items.map((i) => ({ question: i.question, answer: stripFaqMarkup(i.answer) }))),
                ]}
            />
            <PublicLayout hero>
                <Hero />
                {/* 2. Trust intro (Figma 712-25112 / 712-25584): real figure, advisors, Google rating, two CTAs */}
                <TrustIntro figure={figure} />
                {/* 3. Services: the visitor routes themselves */}
                <Services />
                {/* 4. Who we are: the About manifesto in text only (no figures grid: the trust intro already carries the figure), sand band spanning the viewport */}
                <div className="relative left-1/2 w-screen -translate-x-1/2">
                    <AgencyManifesto />
                </div>
                {/* 5. Results, then 6. voices */}
                {/* 5. Results: photos and arrows only, no quote nor button under the carousel (user decision 2026-09-22) */}
                <SuccessStories stories={stories} quote={false} />
                <Testimonials items={testimonials} />
                {/* 7. Objections: the « working with Estate in Paris » FAQ topic, same block as Buy / Sell */}
                <div className={columnClass}>
                    <FaqTeaser
                        id="home-faq-title"
                        faq={faq}
                        texts={{ eyebrow: t('home.faq.eyebrow'), title: t('home.faq.title'), intro: t('home.faq.intro'), all: t('home.faq.all') }}
                    />
                </div>
                {/* 8. Blog preview: the three latest articles, same cards as the article pages; hidden without articles */}
                {posts.length > 0 && (
                    <div className={columnClass}>
                        <BlogRelated
                            posts={posts}
                            header={{ eyebrow: t('blog.title'), title: t('home.blog_title'), intro: t('home.blog_intro') }}
                            cta={{ href: route('blog.index'), label: t('home.blog_cta') }}
                        />
                    </div>
                )}
                {/* 9. Closing call to action (Figma 712-24182 / 712-24510) */}
                <div className="mx-auto mt-16 max-w-5xl px-6 lg:mt-24 lg:px-8">
                    <CtaCard />
                </div>
            </PublicLayout>
        </>
    );
}
