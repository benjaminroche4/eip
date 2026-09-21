import AboutHero from '@/components/about/about-hero';
import AgencyManifesto, { type AgencyStat } from '@/components/about/agency-manifesto';
import TeamGrid, { type TeamMember } from '@/components/about/team-grid';
import ValuesList from '@/components/about/values-list';
import ValuesMarquee from '@/components/about/values-marquee';
import CtaCard from '@/components/home/cta-card';
import Testimonials, { type Testimonial } from '@/components/home/testimonials';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { breadcrumbList, organizationNode } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/**
 * « À propos »: hero (`AboutHero`: eyebrow, h1, answer-first intro, button to the team, proof line + team photo panel with a message carousel), the manifesto + key figures
 * (Figma 712-23876 / 712-24278, sand band) then the team grid (Figma 712-23908), the home's testimonials block, the values block (layout of Figma 712-24134) and the closing CTA card of the
 * home page — the four content sections (who / how / advisor / where) were built then removed (user decision
 * 2026-09-16). JSON-LD: AboutPage about the Organization node + breadcrumb.
 */
type AboutProps = { team: TeamMember[]; testimonials: Testimonial[]; stats: AgencyStat[] };

export default function About({ team, testimonials, stats }: AboutProps) {
    const { t } = useTranslation();
    const { seo, ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('pages.about.title'), url: route('about') },
    ];

    return (
        <>
            <SeoHead
                title={t('pages.about.seo_title')}
                description={t('pages.about.seo_description')}
                jsonLd={[
                    { '@type': 'AboutPage', name: t('pages.about.seo_title'), url: route('about'), about: { '@id': `${origin}/#organization` } },
                    organizationNode(seo, origin),
                    breadcrumbList(crumbs, origin),
                ]}
            />
            <PublicLayout className="max-w-7xl" backdrop={false}>
                <div className="flex flex-col gap-12 lg:gap-16">
                    {/* Hero (Figma 712-23809 / 712-23841 / 712-24213 / 712-24243): header + team photo panel, no façade watermark behind it (user decision 2026-09-16) */}
                    <AboutHero />

                    {/* Commitments band (Figma 712-23866): endless marquee, full width, flush between the hero photo and the
                        manifesto band — no space above or below (user decision 2026-09-16): the hero already cancels the gap
                        above, the band cancels the gap below. */}
                    <div className="relative left-1/2 -mb-12 w-screen -translate-x-1/2 lg:-mb-16">
                        <ValuesMarquee />
                    </div>

                    {/* Manifesto + key figures: sand band spanning the viewport, like the testimonials (Figma 712-23876) */}
                    <div className="relative left-1/2 w-screen -translate-x-1/2">
                        <AgencyManifesto stats={stats} />
                    </div>

                    <TeamGrid members={team} />

                    {/* The home's reviews block: its sand band spans the whole viewport as on the home (breakout: 100vw
                        centred on the column; the layout root clips the scrollbar overflow) — user decision 2026-09-16 */}
                    <div className="relative left-1/2 w-screen -translate-x-1/2">
                        <Testimonials items={testimonials} />
                    </div>

                    {/* Values on the page's white background, no band (user decision 2026-09-16) */}
                    <ValuesList />

                    {/* Same closing call to action as the home page, at the home's width (user decision 2026-09-16) */}
                    <div className="mx-auto w-full max-w-5xl">
                        <CtaCard />
                    </div>
                </div>
            </PublicLayout>
        </>
    );
}
