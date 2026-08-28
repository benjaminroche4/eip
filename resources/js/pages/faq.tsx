import FaqTabs from '@/components/faq/faq-tabs';
import { type FaqCategory } from '@/components/faq/types';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { stripFaqMarkup } from '@/lib/faq-markup';
import { breadcrumbList, faqPage } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type FaqProps = { categories: FaqCategory[] };

/** FAQ page: answer-first intro, then the questions by topic (FaqTabs) + FAQPage JSON-LD over every question. */
export default function FaqPage({ categories }: FaqProps) {
    const { t } = useTranslation();
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('pages.faq.title'), url: route('faq') },
    ];

    return (
        <>
            <SeoHead
                title={t('pages.faq.seo_title')}
                description={t('pages.faq.seo_description')}
                jsonLd={[
                    breadcrumbList(crumbs, origin),
                    faqPage(categories.flatMap((c) => c.items.map((i) => ({ question: i.question, answer: stripFaqMarkup(i.answer) })))),
                ]}
            />
            <PublicLayout>
                <div className="flex flex-col gap-12 lg:gap-16 lg:px-10">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <PageEyebrow>{t('pages.faq.title')}</PageEyebrow>
                            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t('faq.headline')}</h1>
                        </div>
                        <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{t('pages.faq.intro')}</p>
                    </div>
                    <FaqTabs categories={categories} />
                </div>
            </PublicLayout>
        </>
    );
}
