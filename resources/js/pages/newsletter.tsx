import NewsletterBenefits from '@/components/newsletter/newsletter-benefits';
import NewsletterForm, { type NextIssue } from '@/components/newsletter/newsletter-form';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { breadcrumbList } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type NewsletterProps = { nextIssue: NextIssue };

/** Newsletter page (Figma 262-7802): wavy hairlines backdrop, eyebrow + h1 + answer, subscription card, three benefits. */
export default function Newsletter({ nextIssue }: NewsletterProps) {
    const { t } = useTranslation();
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('pages.newsletter.title'), url: route('newsletter') },
    ];

    return (
        <>
            <SeoHead
                title={t('pages.newsletter.seo_title')}
                description={t('pages.newsletter.seo_description')}
                jsonLd={breadcrumbList(crumbs, origin)}
            />
            <PublicLayout>
                <div className="flex flex-col items-center gap-10">
                    {/* Same plain page background as every other public page (the Figma sand band was removed, user decision 2026-09-15) */}
                    <div className="flex flex-col items-center gap-10">
                        {/* Rhythm: 12px eyebrow → h1 (Figma said 8, too tight), 12px h1 → subtitle */}
                        <div className="flex max-w-3xl flex-col items-center gap-3 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <PageEyebrow>{t('pages.newsletter.title')}</PageEyebrow>
                                <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t('newsletter.headline')}</h1>
                            </div>
                            <p className="text-muted-foreground max-w-2xl text-base/7 text-balance sm:text-sm/6">{t('newsletter.subtitle')}</p>
                        </div>
                        <NewsletterForm nextIssue={nextIssue} />
                    </div>
                    <NewsletterBenefits />
                </div>
            </PublicLayout>
        </>
    );
}
