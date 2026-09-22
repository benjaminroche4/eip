import CtaCard from '@/components/home/cta-card';
import Hero from '@/components/home/hero';
import Services from '@/components/home/services';
import SuccessStories, { type SuccessStory } from '@/components/home/success-stories';
import Testimonials, { type Testimonial } from '@/components/home/testimonials';
import TrustIntro from '@/components/home/trust-intro';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { siteGraph } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type HomeProps = { testimonials: Testimonial[]; stories: SuccessStory[]; figure: string };

export default function Home({ testimonials, stories, figure }: HomeProps) {
    const { seo, ziggy } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const origin = new URL(ziggy.location).origin;

    return (
        <>
            <SeoHead
                title={t('home.seo_title')}
                withSuffix={false}
                description={t('home.seo_description')}
                jsonLd={siteGraph(seo, origin, route('search'))}
            />
            <PublicLayout hero>
                <Hero />
                {/* Trust intro (Figma 712-25112 / 712-25584): real figure, advisors, Google rating, two CTAs */}
                <TrustIntro figure={figure} />
                <Services />
                <Testimonials items={testimonials} />
                <SuccessStories stories={stories} />
                {/* Closing call to action (Figma 712-24182 / 712-24510), shown on the home page for now. */}
                <div className="mx-auto mt-16 max-w-5xl px-6 lg:mt-24 lg:px-8">
                    <CtaCard />
                </div>
            </PublicLayout>
        </>
    );
}
